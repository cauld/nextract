/**
 * The base plugin class that all plugins inherit from
 *
 * @class Nextract.PluginBase
 */


import config from 'config';
import * as logger from './core/Logger/Logger';
import fs from 'fs';
import path from 'path';
import { isUndefined, isNull, forOwn, isDate, isBoolean, isInteger, isNumber, isString } from 'lodash/fp';
import Worker from 'workerjs';
import through2 from 'through2';
import throughFilter from 'through2-filter';
import throughMap from 'through2-map';
import throughReduce from 'through2-reduce';
import throughSpy from 'through2-spy';
import events from 'events';

let internalDbInstance;
let internalDbPath;
let eventEmitter;

internalDbInstance = null;
internalDbPath = path.resolve(__dirname, '../../internal/db/nextract.sqlite3');

//Provides a connection to the internal Sqlite database
function getInternalDbInstance() {
  if (internalDbInstance === null) {
    internalDbInstance = require('knex')({
      client: 'sqlite3',
      connection: {
        filename: internalDbPath
      },
      useNullAsDefault: true,
      debug: false
    });

    //Sqlite most likely will default to UTF-8, but lets force it to be sure
    internalDbInstance.schema.raw('PRAGMA encoding = "UTF-8"');

    //We want to be able to run many inserts without hitting the busy error.  References:
    //https://github.com/mapbox/node-sqlite3/issues/9
    //http://www.sqlite.org/pragma.html#pragma_journal_mode
    internalDbInstance.schema.raw('PRAGMA journal_mode = WAL');

    //Turn on autovacuum (https://www.techonthenet.com/sqlite/auto_vacuum.php)
    internalDbInstance.schema.raw('PRAGMA auto_vacuum = 1');

    /*
    FIXME: autovacuum is pretty hit or miss. Have even tried truncting and vacuuming
    manually. Sometimes the space is just never reclaimed! Have a feeling it
    thinks there are still open transactions or connections, but even forcing a
    connection destroy doesn't seem to work. One thing that does work is running
    this from the commandline once the job has completed:
    sqlite3 /path/to/nextract/internal/db/nextract.sqlite3 "VACUUM;"

    So for now we'll force it to happen this way...
    */
    eventEmitter = new events.EventEmitter();
    eventEmitter.on('vacuum', forceInternalDatabaseCleanup);
  }

  return internalDbInstance;
}

//See comment in getInternalDbInstance
function forceInternalDatabaseCleanup() {
  let exec = require('child_process').exec;
  let findSqliteCmd = 'which sqlite3';

  exec(findSqliteCmd, function(error, stdout) {
    if (!isNull(error)) return false; //Just skip it

    let pathToSqlite = stdout;
    let sqliteVacuumCmd = pathToSqlite + ' ' + internalDbPath + ' "VACUUM;"';
    exec(sqliteVacuumCmd);
  });
}

//Based on http://stackoverflow.com/a/1349462
function getRandomTemporaryTableName() {
  let charSet = 'abcdefghijklmnopqrstuvwxyz_';
  let randomString = '';
  for (let i = 0; i < 50; i++) {
  	let randomPoz = Math.floor(Math.random() * charSet.length);
  	randomString += charSet.substring(randomPoz,randomPoz + 1);
  }

  return randomString;
}

interface IETL {
  /**
   * Provides convient access to the core system config variables
   *
   * @property ETL.config
   * @for Nextract.PluginBase
   * @type Object
   */
  config: any;

  /**
   * Provides convient access to core logging functionality
   *
   * @property ETL.logger
   * @for Nextract.PluginBase
   * @type Object
   */
  logger: any;
}

interface IPluginBase {

  /**
   * Plugin name
   *
   * @property pluginName
   * @for Nextract.PluginBase
   * @type String
   */
  pluginName: string;

  /**
   * Plugin type (Core or Vendor)
   *
   * @property pluginType
   * @for Nextract.PluginBase
   * @type String
   */
  pluginType: string;

  ETL: IETL;
}

export default class PluginBase implements IPluginBase {
  pluginName: string;
  pluginType: string;
  ETL: IETL = {
    config: null,
    logger: null
  };

  constructor(pluginName: string, pluginType: string) {
    if (!pluginName) {
      throw('A plugin name must be provided to initPlugin!');
    } else {
      this.pluginName = pluginName;
    }

    if (!pluginType) {
      throw('A plugin type (Core or Vendor) must be provided to initPlugin!');
    } else {
      this.pluginType = pluginType;
    }

    this.ETL = {
      config,
      logger
    };
  }

 /**
  * Provides a direct db connection to the internal sqlite3 database. Allows plugins to
  * use knex (http://knexjs.org/) directly against the internal database.
  *
  * @method getInternalDbInstance
  * @for Nextract.PluginBase
  * @example
  *     let internalDbInstance = somePlugin.getInternalDbInstance();
  * @example
  *     internalDbInstance.select('title', 'author', 'year').from('books');
  *
  * @return {Object} A knex connection object
  */
  getInternalDbInstance = () => {
    return getInternalDbInstance();
  };

  /**
   * Provides access to internal sqlite3 database. Allows plugins to run raw db queries as needed.
   *
   * @method runInternalQuery
   * @for Nextract.PluginBase
   * @example
   *     var sql = 'select first_name, last_name, age, salary from users where id = :id';
   * @example
   *     var sqlParams = { id: id };
   * @example
   *     somePlugin.runInternalQuery(insertSql, sqlReplacements, false);
   *
   * @param {String} sql SQL statement to execute. Can be a fully formed SQL select statement or
   * a parameterized one with ":key" placeholders. If the later, then sqlReplacements
   * must be an object of key/values to be replaced.
   * @param {Object} sqlReplacements (optional) List of key/value params to be subbed out
   * in a parameterized query
   * @param {Boolean} expectsResults Should this query return results?
   *
   * @return {Promise} If expectsResults was true then the resolved promise should include an
   * array of query results. Otherwise, resolve is empty.
   */
  runInternalQuery(sql, sqlReplacements, expectsResults) {
    return new Promise((resolve, reject) => {
      let internalDbInstance = getInternalDbInstance();

      if (expectsResults === false) {
        internalDbInstance.raw(sql, sqlReplacements)
          .then(resolve())
          .catch((err) => {
            this.ETL.logger.error('Invalid runInternalQuery request:', err);
            reject(err);
          });
      } else {
        internalDbInstance.raw(sql, sqlReplacements)
          .then((resp) => {
            resolve(resp);
          })
          .catch((err) => {
            this.ETL.logger.error('Invalid runInternalQuery request:', err);
            reject(err);
          });
      }
    });
  };

 /**
  * Provides access to run a select query against the internal sqlite3 database with
  * a streamed response.
  *
  * @method runInternalSelectQueryForStream
  * @for Nextract.PluginBase
  * @example
  *     var sql = 'select first_name, last_name, age, salary from users where id = :id';
  * @example
  *     var sqlParams = { id: id };
  * @example
  *     var stream = somePlugin.runInternalSelectQueryForStream(insertSql, sqlReplacements);
  *
  * @param {String} sql SQL statement to execute. Can be a fully formed SQL select statement or
  * a parameterized one with ":key" placeholders. If the later, then sqlReplacements
  * must be an object of key/values to be replaced.
  * @param {Object} sqlReplacements (optional) List of key/value params to be subbed out
  * in a parameterized query.
  *
  * @return {Stream} Streams the results of the select query
  */
  runInternalSelectQueryForStream(sql, sqlReplacements) {
    let internalDbInstance = getInternalDbInstance();
    let stream = internalDbInstance.raw(sql, sqlReplacements).stream();
    return stream;
  };

  /**
   * Some streams require a more traditional blocking like operation (e.g.) Sort, Group By, etc. We
   * want to process the stream and return back a stream without breaking the stream pipe or giving
   * the appearance of a blocking action.  This method will take the first item of a stream and use it
   * to create a temporary table in our internal database by inspecting its keys and values.
   *
   * @method createTemporaryTableForStream
   * @for Nextract.PluginBase
   *
   * @example
   *     See the sortBy method of the core Sort plugin
   *
   * @param {Object} streamFunction The first object/element of a stream
   *
   * @return {Promise} Resolves with the temporary table name
   */
  createTemporaryTableForStream(streamElement) {
    return new Promise((resolve, reject) => {
      let temporaryTableName = getRandomTemporaryTableName(),
          internalDbInstance = getInternalDbInstance();

      internalDbInstance.schema.createTable(temporaryTableName, (table) => {
        //Use the first stream element to create a column for each key using the key's value
        //to determine the right data type.

        //Note: Sqlite doesn't really have standard data types.  It has type affinity instead so out guesses
        //here just help it out (http://www.sqlite.org/datatype3.html).
        forOwn(streamElement, (value, key) => {
          if (isDate(value)) {
            //TODO: do we need timestamp as well?
            table.dateTime(key);
          } else if (isBoolean(value)) {
            table.boolean(key);
          } else if (isInteger(value)) {
            table.bigInteger(key);
          } else if (isNumber(value)) {
            //TODO: revisit with some real world example. JavaScrip and floating point math
            //is a touchy subject.
            table.decimal(key);
          } else if (isString(value)) {
            table.text(key);
          } else {
            //For other types like object or when we don't know since the value is null
            //we'll go with a blob.
            table.binary(key);
          }
        });
      })
      .then(() => {
        resolve(temporaryTableName);
      })
      .catch((err) => {
        this.ETL.logger.error('Invalid CREATE TABLE request:', err);
        reject(err);
      });
    });
  };

  /**
   * Removes temporary internal database tables creates from usage of createTemporaryTableForStream.
   *
   * @method dropTemporaryTableForStream
   * @for Nextract.PluginBase
   *
   * @param {String} tableName Name of the internal table to be dropped
   * @return {Promise} Promise resolved once table has been resolved
   */
  dropTemporaryTableForStream(tableName) {
    return new Promise((resolve, reject) => {
      let internalDbInstance = getInternalDbInstance();

      internalDbInstance.schema.dropTable(tableName)
        .then(resolve())
        .catch((err) => {
          this.ETL.logger.warn('Invalid DROP TABLE request:', err);
          reject(err);
        })
        .finally(() => {
          internalDbInstance.destroy();
          eventEmitter.emit('vacuum');
        });
    });
  };

  /**
   * Convinence method used by plugins to run code in a background web worker thread. A worker
   * script must exist in the same directory as the plugin itself with a name of Worker.js. The
   * format of the worker script must match the one defined by the npm workerjs module -
   * https://www.npmjs.com/package/workerjs#node-mode---allowing-require
   *
   * @method runInWorker
   * @for Nextract.PluginBase
   *
   * @example
   *     var workerMsg = { cmd: 'orderBy', args: [collection, iteratees, orders] };
   *
   * @example
   *     return pluginUtils.runInWorker(workerMsg);
   *
   * @param {Object} workerMsg The message to be passed to the worker (can be an object)
   *
   * @return {Promise} Promise resolved with worker response msg
   */
  runInWorker(workerMsg) {
    return new Promise((resolve, reject) => {
      //Verify a web worker script for this plugin exists
      let workerScript = path.resolve(__dirname, './' + this.pluginType.toLowerCase() + '/' + this.pluginName + '/Worker.js');
      fs.stat(workerScript, (err, stat) => {
        if (err) {
          reject(`Plugin worker file not found for ${this.pluginName}`);
        } else {
          var worker = new Worker(workerScript, true);

          //Worker callback success handler
          worker.onmessage = function(workerResponse) {
            worker.terminate();
            resolve(workerResponse.data);
          };

          //Worker callback error handler
          worker.onerror = function(event) {
            worker.terminate();
            var rejectMsg = event.message + " (" + event.filename + ":" + event.lineno + ")";
            reject(rejectMsg);
          };

          worker.postMessage(workerMsg);
        }
      });
    });
  };

  /**
   * Accepts a stream transform function that conforms to the through2.obj stream wrapper
   * API. Caller can choose to use through2 or one of the through2 helper modules (map, filter, spy).
   * For more information see - https://github.com/rvagg/through2.
   *
   * @method buildStreamTransform
   * @for Nextract.PluginBase
   *
   * @example
   *     var streamFunction = function(element, index) { return element.foo <= 10 };
   * @example
   *     return pluginName.runTask('sometaskname', streamFunction, 'filter');
   *
   * @param {Function} streamFunction Function that conforms to the through2.obj stream wrapper API
   * @param {Function} streamFlushFunction Function that conforms to the through2.obj stream flush method API (pass null for no flush)
   * @param {String} streamFunctionType (optional, defaults to standard through2) standard, filter, map, reduce, or spy
   *
   * @return {Function} Returns stream transform wrapped using through2
   */
  buildStreamTransform(streamFunction, streamFlushFunction, streamFunctionType = 'standard') {
    let streamWrappedFunction;

    switch(streamFunctionType) {
      case 'filter':
        streamWrappedFunction = throughFilter.obj(streamFunction);
        break;
      case 'map':
        streamWrappedFunction = throughMap.obj(streamFunction);
        break;
      case 'reduce':
        streamWrappedFunction = throughReduce.obj(streamFunction);
        break;
      case 'spy':
        streamWrappedFunction = throughSpy.obj(streamFunction);
        break;
      default:
        streamWrappedFunction = through2.obj(streamFunction, streamFlushFunction);
        break;
    }

    return streamWrappedFunction;
  };

 /**
  * When a plugin needs to get a handle on an incoming stream without using something like through2
  * directly this method can be useful.  It gets a handle in the incoming stream and acts as a passthrough
  * that can be immediately used with another pipe() call.
  *
  * @method getStreamPassthroughForPipe
  * @for Nextract.PluginBase
  *
  * @example
  *     pluginName.getStreamPassthroughForPipe().pipe(someStreamMethod);
  *
  * @return {Stream} Returns passthrough stream
  */
  getStreamPassthroughForPipe() {
    function processStreamInput(element) {
      if (!isUndefined(element)) {
        return element;
      }
    }

    return this.buildStreamTransform(processStreamInput, null, 'map');
  };

};

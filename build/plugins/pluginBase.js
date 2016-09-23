'use strict';

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isInteger2 = require('lodash/isInteger');

var _isInteger3 = _interopRequireDefault(_isInteger2);

var _isBoolean2 = require('lodash/isBoolean');

var _isBoolean3 = _interopRequireDefault(_isBoolean2);

var _isDate2 = require('lodash/isDate');

var _isDate3 = _interopRequireDefault(_isDate2);

var _forOwn2 = require('lodash/forOwn');

var _forOwn3 = _interopRequireDefault(_forOwn2);

var _isNull2 = require('lodash/isNull');

var _isNull3 = _interopRequireDefault(_isNull2);

var _default = require('./config/default');

var _default2 = _interopRequireDefault(_default);

var _Logger = require('./core/Logger/Logger');

var logger = _interopRequireWildcard(_Logger);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _workerjs = require('workerjs');

var _workerjs2 = _interopRequireDefault(_workerjs);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _through2Filter = require('through2-filter');

var _through2Filter2 = _interopRequireDefault(_through2Filter);

var _through2Map = require('through2-map');

var _through2Map2 = _interopRequireDefault(_through2Map);

var _through2Reduce = require('through2-reduce');

var _through2Reduce2 = _interopRequireDefault(_through2Reduce);

var _through2Spy = require('through2-spy');

var _through2Spy2 = _interopRequireDefault(_through2Spy);

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The base plugin class that all plugins inherit from
 *
 * @class Nextract.PluginBase
 */

var internalDbInstance = void 0,
    internalDbPath = void 0,
    eventEmitter = void 0;

internalDbInstance = null;
internalDbPath = _path2.default.resolve(__dirname, '../../internal/db/nextract.sqlite3');

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
    eventEmitter = new _events2.default.EventEmitter();
    eventEmitter.on('vacuum', forceInternalDatabaseCleanup);
  }

  return internalDbInstance;
}

//See comment in getInternalDbInstance
function forceInternalDatabaseCleanup() {
  var exec = require('child_process').exec;
  var findSqliteCmd = 'which sqlite3';

  exec(findSqliteCmd, function (error, stdout) {
    if (!(0, _isNull3.default)(error)) return false; //Just skip it

    var pathToSqlite = stdout;
    var sqliteVacuumCmd = pathToSqlite + ' ' + internalDbPath + ' "VACUUM;"';
    exec(sqliteVacuumCmd);
  });
}

//Based on http://stackoverflow.com/a/1349462
function getRandomTemporaryTableName() {
  var charSet = 'abcdefghijklmnopqrstuvwxyz_';
  var randomString = '';
  for (var i = 0; i < 50; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }

  return randomString;
}

var PluginBase = function PluginBase() {
  var pluginName = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
  var pluginType = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

  var self = this;

  if (pluginName === null) {
    throw "A plugin name must be provided to initPlugin!";
  }

  if (pluginType === null) {
    throw "A plugin type (Core or Vendor) must be provided to initPlugin!";
  }

  /**
   * Plugin name
   *
   * @property pluginName
   * @for Nextract.PluginBase
   * @type String
   */
  this.pluginName = pluginName;

  /**
   * Plugin type (Core or Vendor)
   *
   * @property pluginType
   * @for Nextract.PluginBase
   * @type String
   */
  this.pluginType = pluginType;

  /**
   * Core system functionality is namespaced under this ETL object
   *
   * @property ETL
   * @for Nextract.PluginBase
   * @type Object
   */
  this.ETL = {
    /**
     * Provides convient access to the core system config variables
     *
     * @property ETL.config
     * @for Nextract.PluginBase
     * @type Object
     */
    config: _default2.default,

    /**
     * Provides convient access to core logging functionality
     *
     * @property ELT.logger
     * @for Nextract.PluginBase
     * @type Object
     */
    logger: logger
  };

  this.getInternalDbInstance = function () {
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
  this.runInternalQuery = function (sql, sqlReplacements, expectsResults) {
    return new Promise(function (resolve, reject) {
      var internalDbInstance = getInternalDbInstance();

      if (expectsResults === false) {
        internalDbInstance.raw(sql, sqlReplacements).then(function () {
          resolve();
        }).catch(function (err) {
          self.ETL.logger.error('Invalid runInternalQuery request:', err);
          reject(err);
        });
      } else {
        internalDbInstance.raw(sql, sqlReplacements).then(function (resp) {
          resolve(resp);
        }).catch(function (err) {
          self.ETL.logger.error('Invalid runInternalQuery request:', err);
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
  this.runInternalSelectQueryForStream = function (sql, sqlReplacements) {
    var internalDbInstance = getInternalDbInstance();
    var stream = internalDbInstance.raw(sql, sqlReplacements).stream();
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
  this.createTemporaryTableForStream = function (streamElement) {
    return new Promise(function (resolve, reject) {
      var temporaryTableName = getRandomTemporaryTableName(),
          internalDbInstance = getInternalDbInstance();

      internalDbInstance.schema.createTable(temporaryTableName, function (table) {
        //Use the first stream element to create a column for each key using the key's value
        //to determine the right data type.

        //Note: Sqlite doesn't really have standard data types.  It has type affinity instead so out guesses
        //here just help it out (http://www.sqlite.org/datatype3.html).
        (0, _forOwn3.default)(streamElement, function (value, key) {
          if ((0, _isDate3.default)(value)) {
            //TODO: do we need timestamp as well?
            table.dateTime(key);
          } else if ((0, _isBoolean3.default)(value)) {
            table.boolean(key);
          } else if ((0, _isInteger3.default)(value)) {
            table.bigInteger(key);
          } else if ((0, _isNumber3.default)(value)) {
            //TODO: revisit with some real world example. JavaScrip and floating point math
            //is a touchy subject.
            table.decimal(key);
          } else if ((0, _isString3.default)(value)) {
            table.text(key);
          } else {
            //For other types like object or when we don't know since the value is null
            //we'll go with a blob.
            table.binary(key);
          }
        });
      }).then(function () {
        resolve(temporaryTableName);
      }).catch(function (err) {
        self.ETL.logger.error('Invalid CREATE TABLE request:', err);
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
  this.dropTemporaryTableForStream = function (tableName) {
    return new Promise(function (resolve, reject) {
      var internalDbInstance = getInternalDbInstance();

      internalDbInstance.schema.dropTable(tableName).then(function () {
        resolve();
      }).catch(function (err) {
        self.ETL.logger.warn('Invalid DROP TABLE request:', err);
        reject(err);
      }).finally(function () {
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
  this.runInWorker = function (workerMsg) {
    return new Promise(function (resolve, reject) {
      //Verify a web worker script for this plugin exists
      var workerScript = _path2.default.resolve(__dirname, './' + self.pluginType.toLowerCase() + '/' + self.pluginName + '/Worker.js');
      _fs2.default.stat(workerScript, function (err, stat) {
        if (err) {
          reject('Plugin worker file not found for', self.pluginName);
        } else {
          var worker = new _workerjs2.default(workerScript, true);

          //Worker callback success handler
          worker.onmessage = function (workerResponse) {
            worker.terminate();
            resolve(workerResponse.data);
          };

          //Worker callback error handler
          worker.onerror = function (event) {
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
  this.buildStreamTransform = function (streamFunction) {
    var streamFlushFunction = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var streamFunctionType = arguments.length <= 2 || arguments[2] === undefined ? 'standard' : arguments[2];

    var streamWrappedFunction;

    switch (streamFunctionType) {
      case 'filter':
        streamWrappedFunction = _through2Filter2.default.obj(streamFunction);
        break;
      case 'map':
        streamWrappedFunction = _through2Map2.default.obj(streamFunction);
        break;
      case 'reduce':
        streamWrappedFunction = _through2Reduce2.default.obj(streamFunction);
        break;
      case 'spy':
        streamWrappedFunction = _through2Spy2.default.obj(streamFunction);
        break;
      default:
        streamWrappedFunction = _through2.default.obj(streamFunction, streamFlushFunction);
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
  this.getStreamPassthroughForPipe = function () {
    function processStreamInput(element) {
      if (!(0, _isUndefined3.default)(element)) {
        return element;
      }
    }

    return this.buildStreamTransform(processStreamInput, null, 'map');
  };
};

module.exports = PluginBase;

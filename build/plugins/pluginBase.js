'use strict';

var _repeat2 = require('lodash/repeat');

var _repeat3 = _interopRequireDefault(_repeat2);

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

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

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The base plugin class that all plugins inherit from
 *
 * @class Nextract.PluginBase
 */

var sqlite3 = require('sqlite3').verbose();

var internalDbConnectionInstance = null,
    internalDbPath = _path2.default.resolve(__dirname, '../../internal/db/nextract.sqlite3');

function getInternalDbInstance() {
  if (internalDbConnectionInstance === null) {
    internalDbConnectionInstance = new sqlite3.Database(internalDbPath, function (err) {
      if (err !== null) {
        logger.log.erro('Error opening internal database!');
      }
    });

    //We want to be able to run many inserts without hitting the busy error.  References:
    //https://github.com/mapbox/node-sqlite3/issues/9
    //http://www.sqlite.org/pragma.html#pragma_journal_mode
    internalDbConnectionInstance.run('PRAGMA journal_mode = WAL;');

    //Turn on autovacuum
    //https://www.techonthenet.com/sqlite/auto_vacuum.php
    internalDbConnectionInstance.run('PRAGMA main.auto_vacuum = 1;');
  }

  return internalDbConnectionInstance;
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

  /**
   * Provides access to internal sqlite3 database. Allows plugins to run raw queries as needed
   * to create tables, query them, cleanup,etc.
   *
   * @method runInternalQuery
   * @for Nextract.PluginBase
   * @example
   *     var sql = 'select first_name, last_name, age, salary from users where id = :id';
   * @example
   *     var sqlParams = { id: id };
   * @example
   *     somePlugin.runInternalQuery(insertSql, sqlReplacements, false, callbackFunction);
   *
   * @param {String} sql SQL statement to execute. Can be a fully formed SQL select statement or
   * a parameterized one with ":key" placeholders. If the later, then sqlReplacements
   * must be an object of key/values to be replaced.
   * @param {Object} sqlReplacements (optional) List of key/value params to be subbed out
   * in a parameterized query
   * @param {Boolean} expectsResults Should this query return results?
   * @param {Function} callback Function to be called once the temporary table has been completed
   *
   * @return {Array/undefined} If expectsResults was true then the return should include an
   * array of query results. Otherwise, nothing is returned.
   */
  this.runInternalQuery = function (sql, sqlReplacements, expectsResults, callback) {
    var dbInstance = getInternalDbInstance();

    if (expectsResults === false) {
      dbInstance.run(sql, sqlReplacements, function () {
        callback();
      });
    } else {
      dbInstance.all(sql, sqlReplacements, function (err, rows) {
        callback(err, rows);
      });
    }
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
   * @param {Function} callback Function to be called once the temporary table has been completed
   *
   * @return {String} Returns the temporary table name
   */
  this.createTemporaryTableForStream = function (streamElement, callback) {
    var createTableSql,
        temporaryTableName = getRandomTemporaryTableName(),
        columnDefs = [];

    //Note: Sqlite doesn't really have standard data types.  It has type affinity instead so out guesses
    //here just help it out (http://www.sqlite.org/datatype3.html).
    (0, _forOwn3.default)(streamElement, function (value, key) {
      var columnDataType;

      if ((0, _isDate3.default)(value)) {
        columnDataType = 'DATETIME';
      } else if ((0, _isBoolean3.default)(value)) {
        columnDataType = 'BOOLEAN';
      } else if ((0, _isInteger3.default)(value)) {
        columnDataType = 'INTEGER';
      } else if ((0, _isNumber3.default)(value)) {
        columnDataType = 'REAL';
      } else if ((0, _isString3.default)(value)) {
        columnDataType = 'TEXT';
      } else {
        //For other types like object or when we don't know since the value is null
        //we'll go with a blob.
        columnDataType = 'BLOB';
      }

      columnDefs[columnDefs.length] = '`' + key + '` ' + columnDataType + ' DEFAULT NULL';
    });

    createTableSql = 'CREATE TABLE ' + temporaryTableName + ' (' + columnDefs.join(',') + '); COMMIT;';

    self.runInternalQuery(createTableSql, [], false, function (err) {
      if (err) self.ETL.logger.error('Invalid CREATE TABLE request:', err);

      return callback(temporaryTableName);
    });
  };

  this.dropTemporaryTableForStream = function (temporaryTableName, callback) {
    var dropTableSql = 'DROP TABLE IF EXISTS ' + temporaryTableName + '; COMMIT;';

    self.runInternalQuery(dropTableSql, [], false, function (err) {
      if (err) self.ETL.logger.error('Invalid DROP TABLE request:', err);

      return callback();
    });
  };

  /**
   * Some streams require a more traditional blocking like operation (e.g.) Sort, Group By, etc. We
   * want to process the stream and return back a stream without breaking the stream pipe or giving
   * the appearance of a blocking action.  This method will take the first item of a stream and use it
   * to create a boilerplate INSERT statement for all items in a stream. Par this method with
   * createTemporaryTableForStream.
   *
   * @method getBoilerplateStreamInsertStatement
   * @for Nextract.PluginBase
   *
   * @example
   *     See the sortBy method of the core Sort plugin
   *
   * @param {String} temporaryTableName The temporary table name created by a call to createTemporaryTableForStream
   * @param {Object} streamFunction The first object/element of a stream
   * @param {Boolean} escapeColumnNames If true columns names are escaped (e.g.) `column_foo`
   *
   * @return {String} Returns the boilerplate INSERT statement with "?" value placeholders
   */
  this.getBoilerplateStreamInsertStatement = function (temporaryTableName, element) {
    var escapeColumnNames = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

    var keys, replaceMarks, valueReplacementString, columns, columnReplacementString, insertSql;

    keys = (0, _keys3.default)(element);

    replaceMarks = [];
    for (var i = 0; i < keys.length; i++) {
      replaceMarks[replaceMarks.length] = '?';
    }

    valueReplacementString = replaceMarks.join(',');

    //Wrap the property name to be safe
    if (escapeColumnNames === true) {
      columns = keys.map(function (v) {
        return '`' + v + '`';
      });
    } else {
      columns = keys.map(function (v) {
        return v;
      });
    }

    columnReplacementString = columns.join(',');

    insertSql = 'INSERT INTO ' + temporaryTableName + ' (' + columnReplacementString + ') VALUES (' + valueReplacementString + ')';

    return insertSql;
  };

  /**
   * TBD...
   */
  this.getBoilerplateStreamBulkInsertStatement = function (temporaryTableName, firstElement, batchCount) {
    var escapeColumnNames = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

    var keys, batchValues, valuesPlaceholder, valueReplacementString, columns, columnReplacementString, insertSql;

    keys = (0, _keys3.default)(firstElement);

    //Build the columns replacement string

    //Wrap the property name to be safe
    if (escapeColumnNames === true) {
      columns = keys.map(function (v) {
        return '`' + v + '`';
      });
    } else {
      columns = keys.map(function (v) {
        return v;
      });
    }

    columnReplacementString = columns.join(',');

    //Build the values replacement string
    valuesPlaceholder = '(' + (0, _repeat3.default)('?', columns.length).split('').join(',') + ')';
    batchValues = [];
    for (var i = 0; i < batchCount; i++) {
      batchValues[batchValues.length] = valuesPlaceholder;
    }
    valueReplacementString = batchValues.join(', ');

    insertSql = 'INSERT INTO ' + temporaryTableName + ' (' + columnReplacementString + ') VALUES ' + valueReplacementString;

    return insertSql;
  };
};

module.exports = PluginBase;

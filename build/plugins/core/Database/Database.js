'use strict';

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

var _eachOfSeries = require('async/eachOfSeries');

var _eachOfSeries2 = _interopRequireDefault(_eachOfSeries);

var _eachSeries = require('async/eachSeries');

var _eachSeries2 = _interopRequireDefault(_eachSeries);

var _eachOfLimit = require('async/eachOfLimit');

var _eachOfLimit2 = _interopRequireDefault(_eachOfLimit);

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var databasePlugin,
    connectionInstances = {};

//Instantiate the plugin


//TODO: Remove...
/**
 * Mixes in methods used to work with a database
 *
 * @class Nextract.Plugins.Core.Database
 */

/*
TODO:
1) Transactions (http://docs.sequelizejs.com/en/v3/docs/transactions/)
*/

databasePlugin = new _pluginBase2.default('Database', 'Core');

//TODO: Document db connection options/configuration
//Ref - http://knexjs.org/#Installation-client
function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  var dbpluginConfig = databasePlugin.ETL.config.databases[dbName];

  var dbConfigObject = {
    client: dbpluginConfig.client
  };

  if (dbpluginConfig.client === 'sqlite3') {
    dbConfigObject.connection = {
      filename: dbpluginConfig.filename
    };
  } else {
    dbConfigObject.connection = {
      host: dbpluginConfig.host,
      user: dbpluginConfig.user,
      password: dbpluginConfig.password,
      database: dbpluginConfig.database
    };
  }

  //Enable searchPath for pg if user wants to set the schema (public by default)
  if (dbpluginConfig.client === 'pg' && (0, _has3.default)(dbpluginConfig, 'searchPath') === true) {
    dbConfigObject.searchPath = dbpluginConfig.searchPath;
  }

  //Enable db connection pool?
  //Can be any setting supported by https://github.com/coopernurse/node-pool
  if ((0, _has3.default)(dbpluginConfig, 'pool') === true) {
    dbConfigObject.pool = dbpluginConfig.pool;
  }

  //Enable db debugging?
  dbConfigObject.debug = (0, _has3.default)(dbpluginConfig, 'debug') === true ? dbpluginConfig.debug : false;

  connectionInstances[dbName] = require('knex')(dbConfigObject);
}

//Database singleton mgmt
//Sequelize will setup a connection pool on initialization so you should ideally only ever create one instance per database.
function getInstance(dbName) {
  if ((0, _has3.default)(connectionInstances, dbName) === false) {
    buildNewConnection(dbName);
  }

  return connectionInstances[dbName];
}

//Creates an object with the necessary extra sql and sql replacement params for an incoming
//stream element for set of filter criteria. Expects matchCriteria in the following format:
//(e.g.) var matchCriteria = [{ tableColumn: '', comparator: '', collectionField: '' }];
function buildSqlObjectsForCollectionWithMatchCriteria(element, matchCriteria) {
  var columnsToUpdate = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var sqlObject = {
    extraSql: '',
    sqlParams: {}
  };

  matchCriteria.forEach(function (mc, index) {
    if (index > 0) {
      sqlObject.extraSql += ' AND ';
    }

    sqlObject.extraSql += mc.tableColumn + mc.comparator + ':' + mc.collectionField;
    sqlObject.sqlParams[mc.collectionField] = element[mc.collectionField];
  });

  //If this is an INSERT or UPDATE then we need to inject replacements for each updateable column as well
  if ((0, _isArray3.default)(columnsToUpdate) && !(0, _isEmpty3.default)(columnsToUpdate)) {
    columnsToUpdate.forEach(function (column) {
      sqlObject.sqlParams[column] = element[column];
    });
  }

  return sqlObject;
}

module.exports = {

  /**
   * Query interface for select statements
   *
   * @method selectQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var sql = 'select first_name, last_name, age, salary from users where id = :id';
   * @example
   *     var sqlParams = { id: id };
   * @example
   *     ETL.Plugins.Core.Database.selectQuery('dbname', sql, sqlParams);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} sql SQL statement to execute. Can be a fully formed SQL select statement or
   * a parameterized one with ":key" placeholders. If the later, then sqlReplacements
   * must be an object of key/values to be replaced.
   * @param {Object} sqlReplacements (optional) List of key/value params to be subbed out in a parameterized query
   *
   * @return {Promise} Returns a promise resolved with a read stream to use in conjuction with pipe()
   */
  selectQuery: function selectQuery(dbName, sql) {
    var sqlReplacements = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var dbInstance = getInstance(dbName);
    var stream = dbInstance.raw(sql, sqlReplacements).stream();
    return stream;
  },

  /**
   * Allows you to run an DELETE query against a database using data obtained from previous steps. Runs
   * a query for each element in the stream.
   *
   * @method deleteQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var matchCriteria = [
   *      { tableColumn: 'first_name', comparator: '=', collectionField: 'first_name' },
   *      { tableColumn: 'last_name', comparator: '=', collectionField: 'last_name' }
   *     ];
   * @example
   *     return ETL.Plugins.Core.Database.deleteQuery('nextract_sample', 'users', matchCriteria);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Array} matchCriteria Array of objects with key/value params to be subbed out in a
   * parameterized query. The expected format is  [{ tableColumn: '', comparator: '', collectionField: '' }].
   */
  deleteQuery: function deleteQuery(dbName, tableName) {
    var matchCriteria = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    var dbInstance = getInstance(dbName);
    var baseQuery = 'DELETE FROM ' + tableName + ' WHERE ';

    function processStreamDelete(element, encoding, callback) {
      if (!(0, _isUndefined3.default)(element)) {
        var sqlObject = buildSqlObjectsForCollectionWithMatchCriteria(element, matchCriteria, null);

        dbInstance.query(baseQuery + sqlObject.extraSql, {
          replacements: sqlObject.sqlParams,
          type: dbInstance.QueryTypes.DELETE
        }).then(function () {
          //Nothing to return as this was a delete
          callback(null, null);
        }).catch(function (err) {
          databasePlugin.logger.error(err);
          throw new Error(err);
        });
      } else {
        callback(null, {});
      }
    }

    return databasePlugin.buildStreamTransform(processStreamDelete, null, 'standard');
  },

  /**
   * Allows you to run an UPDATE query against a database using data obtained from previous steps. Runs
   * a query for each element in the stream.
   *
   * @method updateQuery
   * @for Nextract.Plugins.Core.Database
   *
   * @example
   *     var matchCriteria = [{ tableColumn: 'id', comparator: '=', collectionField: 'id' }];
   * @example
   *     return ETL.Plugins.Core.Database.updateQuery('nextract_sample', 'users', ['first_name'], matchCriteria);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Array} columnsToUpdate Array of property (column) names to use in the UPDATE
   * @param {Array} matchCriteria Array of objects with key/value params to be subbed out in a
   * parameterized query. The expected format is  [{ tableColumn: '', comparator: '', collectionField: '' }].
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  updateQuery: function updateQuery(dbName, tableName, columnsToUpdate) {
    var matchCriteria = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    var baseQuery,
        dbInstance = getInstance(dbName);

    baseQuery = 'UPDATE ' + tableName + ' SET ';
    columnsToUpdate.forEach(function (column, index) {
      if (index > 0) {
        baseQuery += ', ';
      }
      baseQuery += column + ' = :' + column;
    });
    baseQuery += ' WHERE ';

    function processStreamUpdate(element, encoding, callback) {
      if (!(0, _isUndefined3.default)(element)) {
        var sqlObject = buildSqlObjectsForCollectionWithMatchCriteria(element, matchCriteria, columnsToUpdate);

        dbInstance.query(baseQuery + sqlObject.extraSql, {
          replacements: sqlObject.sqlParams,
          type: dbInstance.QueryTypes.DELETE
        }).then(function () {
          return callback(null, element);
        }).catch(function (err) {
          databasePlugin.logger.error(err);
          throw new Error(err);
        });
      } else {
        return callback(null, null);
      }
    }

    return databasePlugin.buildStreamTransform(processStreamUpdate, null, 'standard');
  },

  /**
   * Will insert each stream item into a database table. Uses batched inserts for performance gains.
   *
   * @method insertQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     transform.Plugins.Core.Database.insertQuery('nextract_sample', 'page')
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Integer} batchAmount (optional) Number of rows to batch insert (defaults to 1000)
   */
  insertQuery: function insertQuery(dbName, tableName) {
    var batchSize = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];

    var dbInstance = getInstance(dbName);
    var elementsToInsert = [];
    var stream = null;

    var q = _async2.default.queue(function (element, callback) {
      //Add to the batch
      elementsToInsert[elementsToInsert.length] = element;

      //Insert the batch if we've reached the limit
      if (elementsToInsert.length === batchSize) {
        dbInstance.batchInsert(tableName, elementsToInsert, batchSize).then(function () {
          elementsToInsert = []; //reset
          //Calling callback in sync fashion gets lost in the shuffle when many many items are queued up.
          //Calling through setImmediate solves this.
          setImmediate(function () {
            callback();
          });
        }).catch(function (err) {
          databasePlugin.ETL.logger.error('Invalid INSERT request:', err);
        });
      } else {
        //Batch limit not reached, just continue...
        setImmediate(function () {
          callback();
        });
      }
    }, 5);

    function processStreamInput(element, encoding, callback) {
      stream = this;

      if (!(0, _isUndefined3.default)(element)) {
        q.push(element, function () {
          callback(null, null);
        });
      } else {
        callback(null, null);
      }
    }

    //Takes the place of q.drain (more appropriate when using through2)
    function flushInsert(callback) {
      if (elementsToInsert.length > 0) {
        dbInstance.batchInsert(tableName, elementsToInsert, elementsToInsert.length).then(function () {
          stream.push(null);
          callback();
        }).catch(function (err) {
          databasePlugin.ETL.logger.error('Invalid INSERT request:', err);
        });
      } else {
        //Nothing left, just continue...
        stream.push(null);
        callback();
      }
    }

    return databasePlugin.buildStreamTransform(processStreamInput, flushInsert, 'standard');
  },

  /**
   * Allows you to run a select query against a database using data obtained from previous steps. Runs
   * a query for each row in the collection. The collection will be returned with the properties of the
   * original item data + the properties of the joined data.  Optionally returns all or just matched rows.
   *
   * @method joinQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var joinSQL = 'select first_name, last_name from users where id = :id';
   * @example
   *     var joinColumnsToReturn = ['first_name', 'last_name'];
   * @example
   *     ETL.Plugins.Core.Database.joinQuery(streamElement, 'nextract_sample', joinSQL, queryResults, true, joinColumnsToReturn);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} sqlStatment The sql to run for each row in the collection. The WHERE clause should contain
   * some :propertyName reference to match on against the current row. The query must return only 1 matching row.
   * @param {Boolean} returnedUnmatched (optional: defaults to true) Returns all original collection items
   * will null as the value for properties missed in the join.  If true, then joinColumnsToReturn must be given.
   * @param {Array} joinColumnsToReturn A list of the properties to return in the unmatched case. Should
   * normally match the columns defined in the SELECT clause. Only required if returnedUnmatched is set to true.
   *
   * @return {Promise} Promise resolved once all queries have completed
   */
  joinQuery: function joinQuery(dbName, sqlStatement) {
    var returnedUnmatched = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
    var joinColumnsToReturn = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    var dbInstance = getInstance(dbName);

    var streamFunction = function streamFunction(element, encoding, callback) {
      var that = this;

      if ((0, _isEmpty3.default)(element)) {
        this.push(element);
        return callback();
      } else {
        dbInstance.query(sqlStatement, {
          replacements: element,
          type: dbInstance.QueryTypes.SELECT
        }).then(function (joinData) {
          //Join the data sets if possible
          if (joinData.length === 1) {
            //Add the join data to the original element
            element = (0, _merge3.default)(element, joinData[0]);
          } else if (joinData.length === 0 && returnedUnmatched === true) {
            //They want the original element back even though there is no matching join. Add the missing
            //properties and set each to null (like an outer join).
            if ((0, _isArray3.default)(joinColumnsToReturn) && joinColumnsToReturn.length > 0) {
              joinColumnsToReturn.map(function (c) {
                return element[c] = null;
              });
            } else {
              throw new Error("To returned unmatched elements joinColumnsToReturn must be an array of property names!");
            }
          } else if (joinData.length === 0 && returnedUnmatched === false) {
            //We want to drop this element from the collection for lack of a join.
            element = null;
          } else if (joinData.length > 1) {
            //A throw here will trigger the reject in our catch
            throw new Error("Too many rows returned from join operation!");
          } else {
            //Should never get here
            throw new Error("Unhandled join exception!");
          }

          that.push(element);
          return callback();
        }).catch(function (err) {
          databasePlugin.ETL.logger.error('Invalid join/lookup request:', err);
        });
      }
    };

    //This is kind of like a map, except through2-map doesn't allow us to remmove
    //elements from the stream (i.e.) that.push(null);
    return databasePlugin.buildStreamTransform(streamFunction, null, 'standard');
  }

};

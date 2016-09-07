'use strict';

var _pull2 = require('lodash/pull');

var _pull3 = _interopRequireDefault(_pull2);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _repeat2 = require('lodash/repeat');

var _repeat3 = _interopRequireDefault(_repeat2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

var _eachOfSeries = require('async/eachOfSeries');

var _eachOfSeries2 = _interopRequireDefault(_eachOfSeries);

var _eachSeries = require('async/eachSeries');

var _eachSeries2 = _interopRequireDefault(_eachSeries);

var _eachOfLimit = require('async/eachOfLimit');

var _eachOfLimit2 = _interopRequireDefault(_eachOfLimit);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var databasePlugin,
    connectionInstances = {},
    queryLogging,
    enableQueryLogging = false; /**
                                 * Mixes in methods used to work with a database
                                 *
                                 * @class Nextract.Plugins.Core.Database
                                 */

/*
TODO:
1) Transactions (http://docs.sequelizejs.com/en/v3/docs/transactions/)
*/

queryLogging = enableQueryLogging === false ? false : sequelizeQueryLogging;

//Instantiate the plugin
databasePlugin = new _pluginBase2.default('Database', 'Core');

//Sequelize expects a function for logging or false for no logging
function sequelizeQueryLogging(sql) {
  databasePlugin.ETL.logger.info('SQL Debugging:', sql);
}

function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  var dbpluginConfig = databasePlugin.ETL.config.databases[dbName];

  connectionInstances[dbName] = new _sequelize2.default(dbpluginConfig.name, dbpluginConfig.user, dbpluginConfig.password, {
    host: dbpluginConfig.host,
    dialect: dbpluginConfig.dialect,
    searchPath: (0, _has3.default)(dbpluginConfig, 'searchPath') ? dbpluginConfig.searchPath : '',
    dialectOptions: {
      prependSearchPath: (0, _has3.default)(dbpluginConfig, 'dialectOptions') && (0, _has3.default)(dbpluginConfig.dialectOptions, 'prependSearchPath') ? dbpluginConfig.dialectOptions.searchPath : ''
    },
    storage: (0, _has3.default)(dbpluginConfig, 'storage') ? dbpluginConfig.storage : '', //SQLite only
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    logging: queryLogging
  });
}

//Database singleton mgmt
//Sequelize will setup a connection pool on initialization so you should ideally only ever create one instance per database.
function getInstance(dbName) {
  if ((0, _has3.default)(connectionInstances, dbName) === false) {
    buildNewConnection(dbName);
  }

  return connectionInstances[dbName];
}

//Method used in conjuction with runMany.  Takes an incoming collection and set of
//filter criteria and creates an object with the necessary extra sql and sql replacement
//params for each item in the collect.  Expects matchCriteria in the following format:
//(e.g.) var matchCriteria = [{ tableColumn: '', comparator: '', collectionField: '' }];
function buildSqlObjectsForCollectionWithMatchCriteria(collection, matchCriteria) {
  var columnsToUpdate = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var sqlObjects = [];

  collection.forEach(function (element) {
    var extraSql = '',
        sqlParams = {};

    matchCriteria.forEach(function (mc, index) {
      if (index > 0) {
        extraSql += ' AND ';
      }

      extraSql += mc.tableColumn + mc.comparator + ':' + mc.collectionField;
      sqlParams[mc.collectionField] = element[mc.collectionField];
    });

    //If this is an INSERT or UPDATE then we need to inject replacements for each updateable column as well
    if ((0, _isArray3.default)(columnsToUpdate) && !(0, _isEmpty3.default)(columnsToUpdate)) {
      columnsToUpdate.forEach(function (column) {
        sqlParams[column] = element[column];
      });
    }

    sqlObjects[sqlObjects.length] = {
      sql: extraSql,
      sqlParams: sqlParams
    };
  });

  return sqlObjects;
}

//Collection can have many rows resulting in the need to execute multiple queries.  This method
//handles of the running of many async functions with a configurable max amount to run in parallel.
function runMany(dbName, queryType, baseQuery, collection, columnsToUpdate, matchCriteria, maxParallelQueries) {
  return new Promise(function (resolve, reject) {
    var dbInstance = getInstance(dbName);
    var sqlObjects = buildSqlObjectsForCollectionWithMatchCriteria(collection, matchCriteria, columnsToUpdate);

    (0, _eachOfLimit2.default)(sqlObjects, maxParallelQueries, function (element, index, callback) {
      return dbInstance.query(baseQuery + element.sql, {
        replacements: element.sqlParams,
        type: dbInstance.QueryTypes[queryType]
      }).then(function () {
        callback(); //This query is done
      }).catch(function (err) {
        databasePlugin.ETL.logger.error(err);
        reject(err);
      });
    }, function (err) {
      if (err) {
        databasePlugin.ETL.logger.error('Invalid ' + queryType + ' request:', err);
        reject('Invalid ' + queryType + ' request:', err);
      } else {
        //All queries are done.  Resolves with the original collection to enable
        //chaining within ETL programs.
        resolve(collection);
      }
    });
  });
}

module.exports = {

  /**
   * Raw query interface
   *
   * @method rawQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var sql = 'select first_name, last_name, age, salary from users where id = :id';
   * @example
   *     var sqlParams = { id: id };
   * @example
   *     ETL.Plugins.Core.Database.rawQuery('dbname', sql, sqlParams);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} sql SQL statement to execute. Can be a fully formed SQL select statement or
   * a parameterized one with ":key" placeholders. If the later, then sqlParams
   * must be an object of key/values to be replaced.
   * @param {Object} sqlParams (optional) List of key/value params to be subbed out in a parameterized query
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  rawQuery: function rawQuery(dbName, sql) {
    var sqlReplacements = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var dbInstance = getInstance(dbName);

    return dbInstance.query(sql, {
      replacements: sqlReplacements,
      type: dbInstance.QueryTypes.RAW
    }).then(function (data) {
      var objectStream = require('object-stream');
      var readableStream = objectStream.fromArray(data);
      return readableStream;
    }).catch(function (err) {
      databasePlugin.ETL.logger.error('Invalid RAW request:', err);
    });
  },

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
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  selectQuery: function selectQuery(dbName, sql) {
    var sqlReplacements = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var dbInstance = getInstance(dbName);

    return dbInstance.query(sql, {
      replacements: sqlReplacements,
      type: dbInstance.QueryTypes.SELECT
    }).then(function (data) {
      var objectStream = require('object-stream');
      var readableStream = objectStream.fromArray(data);
      return readableStream;
    }).catch(function (err) {
      databasePlugin.ETL.logger.error('Invalid SELECT request:', err);
    });
  },

  /**
   * Allows you to run an DELETE query against a database using data obtained from previous steps. Runs
   * a query for each row in the collection.
   *
   * @method deleteQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var matchCriteria = [
   *      { tableColumn: 'first_name', comparator: '=', collectionField: 'first_name' },
   *      { tableColumn: 'last_name', comparator: '=', collectionField: 'last_name' }
   *     ];
   * @example
   *     return ETL.Plugins.Core.Database.deleteQuery('nextract_sample', 'users', userData, matchCriteria);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Array} collection The collection to iterate on
   * @param {Array} matchCriteria Array of objects with key/value params to be subbed out in a
   * parameterized query. The expected format is  [{ tableColumn: '', comparator: '', collectionField: '' }].
   * @param {Integer}  maxParallelQueries (optional) Max number of queries to run in parallel (defaults to 5)
   *
   * @return {Promise} Promise resolved once all queries have completed
   */
  deleteQuery: function deleteQuery(dbName, tableName, collection) {
    var matchCriteria = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];
    var maxParallelQueries = arguments.length <= 4 || arguments[4] === undefined ? 5 : arguments[4];

    var baseQuery = 'DELETE FROM ' + tableName + ' WHERE ';

    return runMany(dbName, 'DELETE', baseQuery, collection, null, matchCriteria, maxParallelQueries);
  },

  /**
   * Allows you to run an UPDATE query against a database using data obtained from previous steps. Runs
   * a query for each row in the collection.
   *
   * @method updateQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var userData = [ { id: 1, first_name: 'foo' }, {...} ];
   * @example
   *     var matchCriteria = [{ tableColumn: 'id', comparator: '=', collectionField: 'id' }];
   * @example
   *     return ETL.Plugins.Core.Database.updateQuery('nextract_sample', 'users', userData, ['first_name'], matchCriteria);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Array} collection The collection to iterate on
   * @param {Array} columnsToUpdate Array of property (column) names to use in the UPDATE
   * @param {Array} matchCriteria Array of objects with key/value params to be subbed out in a
   * parameterized query. The expected format is  [{ tableColumn: '', comparator: '', collectionField: '' }].
   *
   * @return {Promise} Promise resolved with the give collection once all queries have completed
   */
  updateQuery: function updateQuery(dbName, tableName, collection, columnsToUpdate) {
    var matchCriteria = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];
    var maxParallelQueries = arguments.length <= 5 || arguments[5] === undefined ? 5 : arguments[5];

    var baseQuery = 'UPDATE ' + tableName + ' SET ';

    columnsToUpdate.forEach(function (column, index) {
      if (index > 0) {
        baseQuery += ', ';
      }
      baseQuery += column + ' = :' + column;
    });

    baseQuery += ' WHERE ';

    return runMany(dbName, 'UPDATE', baseQuery, collection, columnsToUpdate, matchCriteria, maxParallelQueries);
  },

  /**
   * Insert query for collections. Will insert each collection item into a database table.
   * Uses batched inserts for performance gains.
   *
   * @method insertQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var columnsToInsert = ['first_name', 'last_name', 'age'];
   * @example
   *     var collectionsToInsert = [
   *      { 'first_name': 'foo', 'last_name': 'bar', 'age': 25 },
   *      { 'first_name': 'foo', 'last_name': 'baz', 'age': 48 }
   *     ];
   * @example
   *     return ETL.Plugins.Core.Database.insertQuery('nextract_sample', 'users', collectionsToInsert, columnsToInsert);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Array} collection The collection to iterate on
   * @param {Array} columnsToInsert Array of property (column) names to use in the INSERT
   * @param {Integer} batchAmount (optional) Number of rows to batch insert (defaults to 1000)
   *
   * @return {Promise} Promise resolved with the give collection once all queries have completed
   */
  insertQuery: function insertQuery(dbName, tableName, collection, columnsToInsert) {
    var batchAmount = arguments.length <= 4 || arguments[4] === undefined ? 1000 : arguments[4];

    var baseQuery, collectionLength, sqlReplacementGroups, valuesPlaceholder, batchGroupsRequired, batchValues, sqlJobs;

    //collection = [collection[0], collection[1]];

    //We'll batch INSERT to improve perfomance. Start by constructing a base INSERT statment.
    baseQuery = 'INSERT INTO ' + tableName + ' (';
    columnsToInsert.forEach(function (column, index) {
      if (index > 0) {
        baseQuery += ', ';
      }
      baseQuery += column;
    });
    baseQuery += ') VALUES ';

    //To batch INSERTs we need to construct a statement like this:
    //INSERT INTO tbl_name (c1,c2,c3) VALUES(1,2,3),(4,5,6),(7,8,9);
    //In this case the values defined here are "?" and will be subbed using sqlReplacements
    collectionLength = collection.length;
    sqlReplacementGroups = [];
    valuesPlaceholder = '(' + (0, _repeat3.default)('?', columnsToInsert.length).split('').join(',') + ')';
    batchGroupsRequired = collectionLength > batchAmount ? Math.ceil(collectionLength / batchAmount) : 1;

    //Using the values placeholder string we create an array of batch values for each batch group. This
    //will end up being a (?, ?, ...) block for each incoming collection row up to the max batch amount.
    batchValues = [];
    for (var i = 0; i < collectionLength; i++) {
      batchValues[batchValues.length] = valuesPlaceholder;

      if (i === collectionLength - 1 || batchValues.length === batchAmount) {
        sqlReplacementGroups[sqlReplacementGroups.length] = batchValues.join(', ');
        batchValues = []; //reset for next group
      }
    }

    //If the incoming collection length is greater than the batch threshold we'll need to send multiple
    //SQL INSERT commands to the database.  Here we prep each batch.
    sqlJobs = [];
    for (var _i = 0; _i < batchGroupsRequired; _i++) {
      var workingBatch = collection.splice(0, batchAmount);
      var collectionsToParams = (0, _map3.default)(workingBatch, function (batch) {
        //We can't gauruntee the order of JavaScript properties and its possible each collection
        //item contains more properties than the ones being requested as part of the insert. So
        //we must handpick them out in the right order here.
        var inOrderVales = [];
        columnsToInsert.forEach(function (col) {
          inOrderVales[inOrderVales.length] = batch[col];
        });

        return inOrderVales;
      });

      sqlJobs[sqlJobs.length] = {
        sql: baseQuery + sqlReplacementGroups[_i],
        sqlParams: (0, _flatten3.default)(collectionsToParams)
      };
    }

    return new Promise(function (resolve, reject) {
      var dbInstance = getInstance(dbName);

      //Run each job and return once all are done
      return (0, _eachSeries2.default)(sqlJobs, function (sqlJob, callback) {
        dbInstance.query(sqlJob.sql, {
          replacements: sqlJob.sqlParams,
          type: dbInstance.QueryTypes.INSERT
        }).then(function () {
          callback(); //Tells async that we are done with this item
        });
      }, function (err) {
        if (err) {
          databasePlugin.ETL.logger.error('Invalid INSERT request:', err);
          reject('Invalid INSERT request:', err);
        } else {
          //All queries are done
          resolve();
        }
      });
    });
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
   *     ETL.Plugins.Core.Database.joinQuery('nextract_sample', joinSQL, queryResults, true, joinColumnsToReturn);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} sqlStatment The sql to run for each row in the collection. The WHERE clause should contain
   * some :propertyName reference to match on against the current row. The query must return only 1 matching row.
   * @param {Array} collection The collection to iterate on
   * @param {Boolean} returnedUnmatched (optional: defaults to true) Returns all original collection items
   * will null as the value for properties missed in the join.  If true, then joinColumnsToReturn must be given.
   * @param {Array} joinColumnsToReturn A list of the properties to return in the unmatched case. Should
   * normally match the columns defined in the SELECT clause. Only required if returnedUnmatched is set to true.
   *
   * @return {Promise} Promise resolved once all queries have completed
   */
  joinQuery: function joinQuery(dbName, sqlStatement, collection) {
    var returnedUnmatched = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];
    var joinColumnsToReturn = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];

    return new Promise(function (resolve, reject) {
      var dbInstance = getInstance(dbName);

      //Run each job and return once all are done
      return (0, _eachOfSeries2.default)(collection, function (element, index, callback) {
        dbInstance.query(sqlStatement, {
          replacements: element,
          type: dbInstance.QueryTypes.SELECT
        }).then(function (joinData) {
          //Join the data sets if possible
          if (joinData.length === 1) {
            //Add the join data to the original element
            element = (0, _merge3.default)(element, joinData[0]);
          } else if (joinData.length === 0 && returnedUnmatched === true) {
            if ((0, _isArray3.default)(joinColumnsToReturn) && joinColumnsToReturn.length > 0) {
              joinColumnsToReturn.map(function (c) {
                return element[c] = null;
              });
            } else {
              throw "To returned unmatched elements joinColumnsToReturn must be an array of property names!";
            }
          } else if (joinData.length === 0 && returnedUnmatched === false) {
            //We want to drop this element from the collection for lack of a join.
            //This will remove the item from the array, but not reindex the array. Important because something like slice
            //Will reindex and invalidate the eachOfSeries iteration cycle. We'll cleanup in the next step before returning.
            delete collection[index];
          } else if (joinData.length > 1) {
            //A throw here will trigger the reject in our catch
            throw "Too many rows returned from join operation!";
          } else {
            //Should never get here
            throw "Unhandled join exception!";
          }

          callback(); //Tells async that we are done with this item
        }).catch(function (err) {
          databasePlugin.ETL.logger.error(err);
          reject(err);
        });
      }, function (err) {
        if (err) {
          databasePlugin.ETL.logger.error('Invalid join/lookup request:', err);
          reject('Invalid join/lookup request:', err);
        } else {
          //All queries are done
          var collectionWithjoinedData = collection;

          //Remove any unmatched results if neeeded
          if (returnedUnmatched === false) {
            collectionWithjoinedData = (0, _pull3.default)(collectionWithjoinedData, undefined);
          }

          resolve(collectionWithjoinedData);
        }
      });
    });
  }

};

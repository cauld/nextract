/**
 * Mixes in methods used to work with a database
 *
 * @class Nextract.Plugins.Core.Database
 */

//TODO: Transactions (http://docs.sequelizejs.com/en/v3/docs/transactions/)

import _ from 'lodash';
import { has, isArray, isUndefined, pull, repeat, values, flatten, map, merge } from 'lodash/fp';
import pluginUtils from '../../pluginUtils';
import eachOfSeries from 'async/eachOfSeries';
import eachSeries from 'async/eachSeries';
import eachOfLimit from 'async/eachOfLimit';
import Sequelize from 'sequelize';

var connectionInstances = {},
    queryLogging,
    enableQueryLogging = false;

queryLogging = (enableQueryLogging === false) ? false : sequelizeQueryLogging;


//Sequelize expects a function for logging or false for no logging
function sequelizeQueryLogging(sql) {
  pluginUtils.logger.info('SQL Debugging:', sql);
}

function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  let dbpluginConfig = pluginUtils.config.databases[dbName];

  connectionInstances[dbName] = new Sequelize(dbpluginConfig.name, dbpluginConfig.user, dbpluginConfig.password, {
    host: dbpluginConfig.host,
    dialect: dbpluginConfig.dialect,
    searchPath: _.has(dbpluginConfig, 'searchPath') ? dbpluginConfig.searchPath : '',
    dialectOptions: {
      prependSearchPath: _.has(dbpluginConfig, 'dialectOptions') &&
                            _.has(dbpluginConfig.dialectOptions, 'prependSearchPath') ? dbpluginConfig.dialectOptions.searchPath : ''
    },
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
  if (_.has(connectionInstances, dbName) === false) {
    buildNewConnection(dbName);
  }

  return connectionInstances[dbName];
}

//Method used in conjuction with runMany.  Takes an incoming collection and set of
//filter criteria and creates an object with the necessary extra sql and sql replacement
//params for each item in the collect.  Expects matchCriteria in the following format:
//(e.g.) var matchCriteria = [{ tableColumn: '', comparator: '', collectionField: '' }];
function buildSqlObjectsForCollectionWithMatchCriteria(collection, matchCriteria, columnsToUpdate = null) {
  var sqlObjects = [];

  collection.forEach(function(element) {
    let extraSql = '',
        sqlParams = {};

    matchCriteria.forEach(function(mc, index) {
      if (index > 0) {
        extraSql += ' AND ';
      }

      extraSql += mc.tableColumn + mc.comparator + ':' + mc.collectionField;
      sqlParams[mc.collectionField] = element[mc.collectionField];
    });

    //If this is an INSERT or UPDATE then we need to inject replacements for each updateable column as well
    if (_.isArray(columnsToUpdate) && !_.isEmpty(columnsToUpdate)) {
      columnsToUpdate.forEach(function(column) {
        sqlParams[column] = element[column];
      });
    }

    sqlObjects[sqlObjects.length] = {
      sql: extraSql,
      sqlParams
    };
  });

  return sqlObjects;
}

//Collection can have many rows resulting in the need to execute multiple queries.  This method
//handles of the running of many async functions with a configurable max amount to run in parallel.
function runMany(dbName, queryType, baseQuery, collection, columnsToUpdate, matchCriteria, maxParallelQueries) {
  return new Promise(function (resolve, reject) {
    let dbInstance = getInstance(dbName);
    let sqlObjects = buildSqlObjectsForCollectionWithMatchCriteria(collection, matchCriteria, columnsToUpdate);

    eachOfLimit(
      sqlObjects,
      maxParallelQueries,
      function(element, index, callback) {
        return dbInstance.query(baseQuery + element.sql, {
          replacements: element.sqlParams,
          type: dbInstance.QueryTypes[queryType]
        })
        .then(function() {
          callback(); //This query is done
        })
        .catch(function(err) {
          pluginUtils.logger.error(err);
          reject(err);
        });
      },
      function(err) {
        if (err) {
          pluginUtils.logger.error('Invalid ' + queryType + ' request:', err);
          reject('Invalid ' + queryType + ' request:', err);
        } else {
          //All queries are done.  Resolves with the original collection to enable
          //chaining within ETL programs.
          resolve(collection);
        }
      }
    );
  });
}

module.exports = {

  /**
   * Raw query interface for select statements
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
   * a parameterized one with ":key" placeholders. If the later, then sqlParams
   * must be an object of key/values to be replaced.
   * @param {Object} sqlParams (optional) List of key/value params to be subbed out in a parameterized query
   *
   * @return {Promise} Promise resolved with an array of database rows that match the given select statement
   */
  selectQuery: function(dbName, sql, sqlReplacements = {}) {
    var dbInstance = getInstance(dbName);

    return dbInstance.query(sql, {
      replacements: sqlReplacements,
      type: dbInstance.QueryTypes.SELECT
    })
    .then(function(data) {
      return data;
    })
    .catch(function(err) {
      pluginUtils.logger.error('Invalid SELECT request:', err);
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
  deleteQuery: function(dbName, tableName, collection, matchCriteria = [], maxParallelQueries = 5) {
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
  updateQuery: function(dbName, tableName, collection, columnsToUpdate, matchCriteria = [], maxParallelQueries = 5) {
    var baseQuery = 'UPDATE ' + tableName + ' SET ';

    columnsToUpdate.forEach(function(column, index) {
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
  insertQuery: function(dbName, tableName, collection, columnsToInsert, batchAmount = 1000) {
    var baseQuery,
        collectionLength,
        sqlReplacementGroups,
        valuesPlaceholder,
        batchGroupsRequired,
        batchValues,
        sqlJobs;

    //We'll batch INSERT to improve perfomance. Start by constructing a base INSERT statment.
    baseQuery = 'INSERT INTO ' + tableName + ' (';
    columnsToInsert.forEach(function(column, index) {
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
    valuesPlaceholder = '(' + _.repeat('?', columnsToInsert.length).split('').join(',') +  ')';
    batchGroupsRequired = (collectionLength > batchAmount) ?  Math.ceil(collectionLength / batchAmount) : 1;

    //Using the values placeholder string we create an array of batch values for each batch group. This
    //will end up being a (?, ?, ...) block for each incoming collection row up to the max batch amount.
    batchValues = [];
    for (let i=0; i<collectionLength; i++) {
      batchValues[batchValues.length] = valuesPlaceholder;

      if (i === (collectionLength - 1) || batchValues.length === batchAmount) {
        sqlReplacementGroups[sqlReplacementGroups.length] = batchValues.join(', ');
        batchValues = []; //reset for next group
      }
    }

    //If the incoming collection length is greater than the batch threshold we'll need to send multiple
    //SQL INSERT commands to the database.  Here we prep each batch.
    sqlJobs = [];
    for (let i=0; i<batchGroupsRequired; i++) {
      let workingBatch = collection.splice(0, batchAmount);
      let collectionsToParams = _.map(workingBatch, function(batch) {
        return _.values(batch);
      });

      sqlJobs[sqlJobs.length] = {
        sql: baseQuery + sqlReplacementGroups[i],
        sqlParams: _.flatten(collectionsToParams)
      };
    }

    return new Promise(function (resolve, reject) {
      let dbInstance = getInstance(dbName);

      //Run each job and return once all are done
      return eachSeries(
        sqlJobs,
        function(sqlJob, callback) {
          dbInstance.query(sqlJob.sql, {
            replacements: sqlJob.sqlParams,
            type: dbInstance.QueryTypes.INSERT
          })
          .then(function() {
            callback(); //Tells async that we are done with this item
          })
          .catch(function(err) {
            pluginUtils.logger.error(err);
            reject(err);
          });
        },
        function(err) {
          if (err) {
            pluginUtils.logger.error('Invalid INSERT request:', err);
            reject('Invalid INSERT request:', err);
          } else {
            //All queries are done
            resolve();
          }
        }
      );
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
  joinQuery: function(dbName, sqlStatement, collection, returnedUnmatched = true, joinColumnsToReturn = []) {
    return new Promise(function (resolve, reject) {
      let dbInstance = getInstance(dbName);

      //Run each job and return once all are done
      return eachOfSeries(
        collection,
        function(element, index, callback) {
          dbInstance.query(sqlStatement, {
            replacements: element,
            type: dbInstance.QueryTypes.SELECT
          })
          .then(function(joinData) {
            //Join the data sets if possible
            if (joinData.length === 1) {
              //Add the join data to the original element
              element = _.merge(element, joinData[0]);
            } else if (joinData.length === 0 && returnedUnmatched === true) {
              if (_.isArray(joinColumnsToReturn) && joinColumnsToReturn.length > 0) {
                 joinColumnsToReturn.map(c => element[c] = null);
              } else {
                throw("To returned unmatched elements joinColumnsToReturn must be an array of property names!");
              }
            } else if(joinData.length === 0 && returnedUnmatched === false) {
              //We want to drop this element from the collection for lack of a join.
              //This will remove the item from the array, but not reindex the array. Important because something like slice
              //Will reindex and invalidate the eachOfSeries iteration cycle. We'll cleanup in the next step before returning.
              delete collection[index];
            } else if (joinData.length > 1) {
              //A throw here will trigger the reject in our catch
              throw("Too many rows returned from join operation!");
            } else {
              //Should never get here
              throw("Unhandled join exception!");
            }

            callback(); //Tells async that we are done with this item
          })
          .catch(function(err) {
            pluginUtils.logger.error(err);
            reject(err);
          });
        },
        function(err) {
          if (err) {
            pluginUtils.logger.error('Invalid join/lookup request:', err);
            reject('Invalid join/lookup request:', err);
          } else {
            //All queries are done
            let collectionWithjoinedData = collection;

            //Remove any unmatched results if neeeded
            if (returnedUnmatched === false) {
              collectionWithjoinedData = _.pull(collectionWithjoinedData, undefined);
            }

            resolve(collectionWithjoinedData);
          }
        }
      );
    });
  }

};

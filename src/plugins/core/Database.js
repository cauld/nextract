/**
 * Mixes in methods used to work with a database
 *
 * @class Nextract.Plugins.Core.Database
 */

import _ from 'lodash';
import { has, isArray, repeat, values, flatten, map } from 'lodash/fp';
import pluginUtils from '../pluginUtils';
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
      function(element) {
        dbInstance.query(baseQuery + element.sql, {
          replacements: element.sqlParams,
          type: dbInstance.QueryTypes[queryType]
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
          //All queries are done
          resolve();
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
   *     var sqlParams = { id: id };
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
   * Delete query executed for each row in the collection
   *
   * @method deleteQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var matchCriteria = [
   *      { tableColumn: 'first_name', comparator: '=', collectionField: 'first_name' },
   *      { tableColumn: 'last_name', comparator: '=', collectionField: 'last_name' }
   *     ];
   *
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
   * Update query executed for each row in the collection
   *
   * @method updateQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var matchCriteria = [
   *      { tableColumn: 'first_name', comparator: '=', collectionField: 'first_name' },
   *      { tableColumn: 'last_name', comparator: '=', collectionField: 'last_name' }
   *     ];
   *
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
  updateQuery: function(dbName, tableName, collection, columnsToUpdate, matchCriteria = [], maxParallelQueries = 5) {
    var baseQuery = 'UPDATE ' + tableName + ' SET ';

    columnsToUpdate.forEach(function(column, index) {
      if (index > 1) {
        baseQuery += ', ';
      }
      baseQuery += column + ' = :' + column;
    });

    baseQuery += ' WHERE ';

    return runMany(dbName, 'UPDATE', baseQuery, collection, columnsToUpdate, matchCriteria, maxParallelQueries);
  },

  /**
   * Insert query executed for each row in the collection. Uses batched inserts for performance gains.
   *
   * @method insertQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var columnsToInsert = ['first_name', 'last_name', 'age'];
   *     var collectionsToInsert = [
   *      { 'first_name': 'foo', 'last_name': 'bar', 'age': 25 },
   *      { 'first_name': 'foo', 'last_name': 'baz', 'age': 48 }
   *     ];
   *
   *     return ETL.Plugins.Core.Database.insertQuery('nextract_sample', 'users', collectionsToInsert, columnsToInsert);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Array} collection The collection to iterate on
   * @param {Array} columnsToUpdate Array of property (column) names to use in the INSERT
   * @param {Integer} batchAmount (optional) Number of rows to batch insert (defaults to 1000)
   *
   * @return {Promise} Promise resolved once all queries have completed
   */
  insertQuery: function(dbName, tableName, collection, columnsToUpdate, batchAmount = 1000) {
    var baseQuery = 'INSERT INTO ' + tableName + ' (';
    columnsToUpdate.forEach(function(column, index) {
      if (index > 0) {
        baseQuery += ', ';
      }
      baseQuery += column;
    });
    baseQuery += ') VALUES ';

    //To batch INSERTs we need to construct a statement like this:
    //INSERT INTO tbl_name (c1,c2,c3) VALUES(1,2,3),(4,5,6),(7,8,9);
    //In this case the values defined here are "?" and will be subbed out in runMany
    var collectionLength = collection.length;
    var sqlReplacementGroups = [];
    var valuesPlaceholder = '(' + _.repeat('?', columnsToUpdate.length).split('').join(',') +  ')';
    var batchGroupsRequired = (collectionLength > batchAmount) ?  Math.ceil(collectionLength / batchAmount) : 1;

    var batchValues = [];
    for (let i=0; i<collectionLength; i++) {
      batchValues[batchValues.length] = valuesPlaceholder;

      if (i === (collectionLength - 1) || batchValues.length === batchAmount) {
        sqlReplacementGroups[sqlReplacementGroups.length] = batchValues.join(', ');
        batchValues = []; //reset for next group
      }
    }

    var sqlJobs = [];
    for (let i=0; i<batchGroupsRequired; i++) {
      var workingBatch = collection.splice(0, batchAmount);
      var collectionsToParams = _.map(workingBatch, function(batch) {
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

  //Execute query for each row in the stream
  joinQuery: function() {

  },

  //Lookup values in db using field values from the stream
  lookupQuery: function() {

  }

};

/**
 * Mixes in methods used to work with a database
 *
 * @class Nextract.Plugins.Core.Database
 */

/*
TODO:
1) Transactions (http://knexjs.org/#Transactions)
2) Better error checking/handling of input values
*/

import async from 'async';
import _ from 'lodash';
import { has, isArray, isUndefined, isNull, map, merge } from 'lodash/fp';
import pluginBase from '../../pluginBase';
import knex from 'knex';

let databasePlugin,
    connectionInstances = {};

//Instantiate the plugin
databasePlugin = new pluginBase('Database', 'Core');

//TODO: Document db connection options/configuration
//Ref - http://knexjs.org/#Installation-client
function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  let dbpluginConfig = databasePlugin.ETL.config.databases[dbName];

  let dbConfigObject = {
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
      database: dbpluginConfig.database,
      port: dbpluginConfig.port
    };
  }

  //Enable searchPath for pg if user wants to set the schema (public by default)
  if (dbpluginConfig.client === 'pg' && _.has(dbpluginConfig, 'searchPath') === true) {
    dbConfigObject.searchPath = dbpluginConfig.searchPath;
  }

  //Enable db connection pool?
  //Can be any setting supported by https://github.com/coopernurse/node-pool
  if (_.has(dbpluginConfig, 'pool') === true) {
    dbConfigObject.pool = dbpluginConfig.pool;
  }

  //Enable db debugging?
  dbConfigObject.debug = (_.has(dbpluginConfig, 'debug') === true) ? dbpluginConfig.debug : false;

  connectionInstances[dbName] = require('knex')(dbConfigObject);
}

//Database singleton mgmt
//Sequelize will setup a connection pool on initialization so you should ideally only ever create one instance per database.
function getInstance(dbName) {
  if (_.has(connectionInstances, dbName) === false) {
    buildNewConnection(dbName);
  }

  return connectionInstances[dbName];
}

//Creates an object with the necessary WHERE clause sql and sql replacement params for an incoming
//stream element for a given set of filter criteria. Expects matchCriteria in the following format:
//(e.g.) var matchCriteria = [{ tableColumn: '', comparator: '', collectionField: '' }];
function buildSqlForMatchCriteria(element, matchCriteria) {
  let sqlObject = {
    sql: '',
    sqlParams: []
  };

  matchCriteria.forEach(function(mc, index) {
    if (index > 0) {
      sqlObject.sql += ' AND ';
    }

    sqlObject.sql += mc.tableColumn + ' ' + mc.comparator + ' ?';
    sqlObject.sqlParams[sqlObject.sqlParams.length] = element[mc.collectionField];
  });

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
  selectQuery: function(dbName, sql, sqlReplacements = {}) {
    let dbInstance = getInstance(dbName);
    let stream = dbInstance.raw(sql, sqlReplacements).stream();
    return stream;
  },

  /**
   * Allows you to run a select query against a database using data obtained from previous steps. Runs
   * a query for each row in the stream. Each stream element will be returned with the properties of the
   * original item data + the properties of the joined data.  Optionally returns all or just matched rows.
   *
   * @method joinQuery
   * @for Nextract.Plugins.Core.Database
   * @example
   *     var joinSQL = 'select first_name, last_name from users where id = ?';
   * @example
   *     var joinFilterColumns = [ 'id' ];
   * @example
   *     var joinColumnsToReturn = ['first_name', 'last_name'];
   * @example
   *     ETL.Plugins.Core.Database.joinQuery(streamElement, 'nextract_sample', joinSQL, joinFilterColumns, joinColumnsToReturn, true);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} sqlStatment The sql to run for each row in the collection. The WHERE clause should contain
   * some ? placeholder references to match on against the current row. The query must return only 1 matching row.
   * @param {Array} joinFilterColumns An array of properties to use as replacements for the ? placeholders. Pulls
   * the values from the incoming element.
   * @param {Array} joinColumnsToReturn A list of the properties to return in the unmatched case. Should
   * normally match the columns defined in the SELECT clause. Only required if returnedUnmatched is set to true.
   * @param {Boolean} returnedUnmatched (optional: defaults to true) Returns all original collection items
   * will null as the value for properties missed in the join.  If true, then joinColumnsToReturn must be given.
   *
   * @return {Stream} Returns stream element with added properties from the join query
   */
  joinQuery: function(dbName, sqlStatement, joinFilterColumns, joinColumnsToReturn = [], returnedUnmatched = true) {
    let dbInstance = getInstance(dbName);

    let streamFunction = function(element, encoding, callback) {
      let stream = this;

      if (_.isEmpty(element)) {
        this.push(element);
        return callback();
      } else {
        let joinValues = [];
        joinFilterColumns.forEach(function(prop) {
          joinValues[joinValues.length] = element[prop];
        });

        dbInstance.raw(sqlStatement, joinValues)
          .then(function(joinData) {
            //Join the data sets if possible
            //NOTE: The result (joinData) will always contain a multidimensional array. If there is no match
            //the first array element will be an empty array, otherwise it will contain the actual
            //join results.  The join results will be an array of objects (rows).  There should be only one.
            if (joinData[0].length === 1) {
              //Add the join data to the original element
              element = _.merge(element, joinData[0][0]);
            } else if (joinData.length === 0 && returnedUnmatched === true) {
              //They want the original element back even though there is no matching join. Add the missing
              //properties and set each to null (like an outer join).
              if (_.isArray(joinColumnsToReturn) && joinColumnsToReturn.length > 0) {
                joinColumnsToReturn.map(c => element[c] = null);
              } else {
                throw new Error('To returned unmatched elements joinColumnsToReturn must be an array of property names!');
              }
            } else if (joinData.length === 0 && returnedUnmatched === false) {
              //We want to drop this element from the collection for lack of a join.
              element = null;
            } else if (joinData.length > 1) {
              //A throw here will trigger the reject in our catch
              throw new Error('Too many rows returned from join operation!');
            } else {
              //Should never get here
              throw new Error('Unhandled join exception!');
            }

            stream.push(element);
            return callback();
          })
          .catch(function(err) {
            databasePlugin.ETL.logger.error('Invalid join/lookup request:', err);
          });
      }
    };

    //This is kind of like a map, except through2-map doesn't allow us to remmove
    //elements from the stream (i.e.) that.push(null);
    return databasePlugin.buildStreamTransform(streamFunction, null, 'standard');
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
   * @param {Integer} queueSize (optional) Number of async queues used to manage batch inserts (defaults to 10)
   */
  insertQuery: function(dbName, tableName, batchSize = 1000, queueSize = 10) {
    let dbInstance = getInstance(dbName);
    let elementsToInsert = [];
    let stream = null;

    let q = async.queue(function(element, callback) {
      //Add to the batch
      elementsToInsert[elementsToInsert.length] = element;

      //Insert the batch if we've reached the limit
      if (elementsToInsert.length === batchSize) {
        dbInstance.batchInsert(tableName, elementsToInsert, batchSize)
          .then(function() {
            elementsToInsert = []; //reset
            //Calling callback in sync fashion gets lost in the shuffle when many many items are queued up.
            //Calling through setImmediate solves this.
            setImmediate(function() {
              callback();
            });
          })
          .catch(function(err) {
            databasePlugin.ETL.logger.error('Invalid INSERT request:', err);
          });
      } else {
        //Batch limit not reached, just continue...
        setImmediate(function() {
          callback();
        });
      }
    }, queueSize);

    function processStreamInput(element, encoding, callback) {
      stream = this;

      if (!_.isUndefined(element)) {
        q.push(element, function() {
          callback(null, null);
        });
      } else {
        callback(null, null);
      }
    }

    //Takes the place of q.drain (more appropriate when using through2)
    function flushInsert(callback) {
      if (elementsToInsert.length > 0) {
        dbInstance.batchInsert(tableName, elementsToInsert, elementsToInsert.length)
          .then(function() {
            stream.push(null);
            callback();
          })
          .catch(function(err) {
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
   * If multiple objects are passed WHERE clauses uses AND for multiple condition filtering.
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  updateQuery: function(dbName, tableName, columnsToUpdate, matchCriteria = []) {
    let dbInstance = getInstance(dbName);

    function processStreamUpdate(element, encoding, callback) {
      if (!_.isUndefined(element)) {
        let whereObj = buildSqlForMatchCriteria(element, matchCriteria);

        let updateObj = {};
        if (_.isArray(columnsToUpdate) && !_.isEmpty(columnsToUpdate)) {
          columnsToUpdate.forEach(function(column) {
            updateObj[column] = element[column];
          });
        }

        dbInstance(tableName)
          .whereRaw(whereObj.sql, whereObj.sqlParams)
          .update(updateObj)
          .then(function() {
            return callback(null, element);
          })
          .catch(function(err) {
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
   * Allows you to run a DELETE query against a database using data obtained from previous steps. Runs
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
  deleteQuery: function(dbName, tableName, matchCriteria = []) {
    let dbInstance = getInstance(dbName);

    function processStreamDelete(element, encoding, callback) {
      if (!_.isUndefined(element)) {
        let whereObj = buildSqlForMatchCriteria(element, matchCriteria);

        dbInstance(tableName)
          .whereRaw(whereObj.sql, whereObj.sqlParams)
          .del()
          .then(function() {
            //Nothing to return as this was a delete
            return callback(null, null);
          })
          .catch(function(err) {
            databasePlugin.logger.error(err);
            throw new Error(err);
          });
      } else {
        callback(null, {});
      }
    }

    return databasePlugin.buildStreamTransform(processStreamDelete, null, 'standard');
  }

};

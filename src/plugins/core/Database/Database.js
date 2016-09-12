/**
 * Mixes in methods used to work with a database
 *
 * @class Nextract.Plugins.Core.Database
 */

/*
TODO:
1) Transactions (http://docs.sequelizejs.com/en/v3/docs/transactions/)
*/

import _ from 'lodash';
import { has, isArray, isUndefined, isNull, pull, repeat, values, flatten, map, merge } from 'lodash/fp';
import pluginBase from '../../pluginBase';
import eachOfSeries from 'async/eachOfSeries';
import eachSeries from 'async/eachSeries';
import eachOfLimit from 'async/eachOfLimit';
import Sequelize from 'sequelize';
import objectStream from 'object-stream';


var databasePlugin,
    connectionInstances = {},
    queryLogging,
    enableQueryLogging = false;

queryLogging = (enableQueryLogging === false) ? false : sequelizeQueryLogging;

//Instantiate the plugin
databasePlugin = new pluginBase('Database', 'Core');


//Sequelize expects a function for logging or false for no logging
function sequelizeQueryLogging(sql) {
  databasePlugin.ETL.logger.info('SQL Debugging:', sql);
}

function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  let dbpluginConfig = databasePlugin.ETL.config.databases[dbName];

  connectionInstances[dbName] = new Sequelize(dbpluginConfig.name, dbpluginConfig.user, dbpluginConfig.password, {
    host: dbpluginConfig.host,
    dialect: dbpluginConfig.dialect,
    searchPath: _.has(dbpluginConfig, 'searchPath') ? dbpluginConfig.searchPath : '',
    dialectOptions: {
      prependSearchPath: _.has(dbpluginConfig, 'dialectOptions') &&
                            _.has(dbpluginConfig.dialectOptions, 'prependSearchPath') ? dbpluginConfig.dialectOptions.searchPath : ''
    },
    storage: _.has(dbpluginConfig, 'storage') ? dbpluginConfig.storage : '', //SQLite only
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

//Creates an object with the necessary extra sql and sql replacement params for an incoming
//stream element for set of filter criteria. Expects matchCriteria in the following format:
//(e.g.) var matchCriteria = [{ tableColumn: '', comparator: '', collectionField: '' }];
function buildSqlObjectsForCollectionWithMatchCriteria(element, matchCriteria, columnsToUpdate = null) {
  let sqlObject = {
    extraSql: '',
    sqlParams: {}
  };

  matchCriteria.forEach(function(mc, index) {
    if (index > 0) {
      sqlObject.extraSql += ' AND ';
    }

    sqlObject.extraSql += mc.tableColumn + mc.comparator + ':' + mc.collectionField;
    sqlObject.sqlParams[mc.collectionField] = element[mc.collectionField];
  });

  //If this is an INSERT or UPDATE then we need to inject replacements for each updateable column as well
  if (_.isArray(columnsToUpdate) && !_.isEmpty(columnsToUpdate)) {
    columnsToUpdate.forEach(function(column) {
      sqlObject.sqlParams[column] = element[column];
    });
  }

  return sqlObject;
}

//We can't guarantee the order of JavaScript properties and its possible each collection
//item contains more properties than the ones being requested as part of the insert. So
//we must handpick them out in the right order here.
function getInOrderValues(streamElement, columnsToInsert) {
  var inOrderValues = [];
  columnsToInsert.forEach(function(col) {
    inOrderValues[inOrderValues.length] = streamElement[col];
  });

  return inOrderValues;
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
  rawQuery: function(dbName, sql, sqlReplacements = {}) {
    var dbInstance = getInstance(dbName);

    return dbInstance.query(sql, {
      replacements: sqlReplacements,
      type: dbInstance.QueryTypes.RAW
    })
    .then(function(data) {
      var readableStream = objectStream.fromArray(data);
      return readableStream;
    })
    .catch(function(err) {
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
   * @return {Promise} Returns a promise resolved with a read stream to use in conjuction with pipe()
   */
  selectQuery: function(dbName, sql, sqlReplacements = {}) {
    var dbInstance = getInstance(dbName);

    return dbInstance.query(sql, {
      replacements: sqlReplacements,
      type: dbInstance.QueryTypes.SELECT
    })
    .then(function(data) {
      var readableStream = objectStream.fromArray(data);
      return readableStream;
    })
    .catch(function(err) {
      databasePlugin.ETL.logger.error('Invalid SELECT request:', err);
    });
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
  deleteQuery: function(dbName, tableName, matchCriteria = []) {
    var dbInstance = getInstance(dbName);
    var baseQuery = 'DELETE FROM ' + tableName + ' WHERE ';

    function processStreamDelete(element, encoding, callback) {
      if (!_.isUndefined(element)) {
        let sqlObject = buildSqlObjectsForCollectionWithMatchCriteria(element, matchCriteria, null);

        dbInstance.query(baseQuery + sqlObject.extraSql, {
          replacements: sqlObject.sqlParams,
          type: dbInstance.QueryTypes.DELETE
        })
        .then(function() {
          //Nothing to return as this was a delete
          callback(null, null);
        })
        .catch(function(err) {
          databasePlugin.logger.error(err);
          throw new Error(err);
        });
      } else {
        console.log("HERERERERER");
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
  updateQuery: function(dbName, tableName, columnsToUpdate, matchCriteria = []) {
    var baseQuery,
        dbInstance = getInstance(dbName);

    baseQuery = 'UPDATE ' + tableName + ' SET ';
    columnsToUpdate.forEach(function(column, index) {
      if (index > 0) {
        baseQuery += ', ';
      }
      baseQuery += column + ' = :' + column;
    });
    baseQuery += ' WHERE ';

    function processStreamUpdate(element, encoding, callback) {
      if (!_.isUndefined(element)) {
        let sqlObject = buildSqlObjectsForCollectionWithMatchCriteria(element, matchCriteria, columnsToUpdate);

        dbInstance.query(baseQuery + sqlObject.extraSql, {
          replacements: sqlObject.sqlParams,
          type: dbInstance.QueryTypes.DELETE
        })
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
  insertQuery: function(dbName, tableName, columnsToInsert, batchAmount = 25) {
    let dbInstance = getInstance(dbName);

    function processStreamInput(element, encoding, callback) {
      var that = this;

      if (_.isUndefined(element)) {
        //We have reach the end of the input stream and we most likely have some left over elements below the batch threshold.
        //So insert the final batch now...
        if (this.elementValuesToInsert.length > 0) {
          //We can't use the original batch statement becauase the value count is different
          var lastInsertSql = databasePlugin.getBoilerplateStreamBulkInsertStatement(tableName, this.dbInfo.sampleElement, this.elementValuesToInsert.length, false);

          dbInstance.query(lastInsertSql, {
            replacements: _.flatten(this.elementValuesToInsert),
            type: dbInstance.QueryTypes.INSERT
          })
          .then(function() {
            that.elementValuesToInsert = null; //done, clear it
            return callback(null, null);
          })
          .catch(function(err) {
            databasePlugin.ETL.logger.error('Invalid INSERT request:', err);
            throw new Error(err);
          });
        } else {
          return callback();
        }
      } else {
        //We need to setup the INSERT sql when encountering the first element in the stream
        if (_.isUndefined(this.dbInfo)) {
          this.elementValuesToInsert = [];

          this.dbInfo = {
            columns: _.keys(element),
            sampleElement: element,
            tableName: tableName,
            insertSql: databasePlugin.getBoilerplateStreamBulkInsertStatement(tableName, element, batchAmount, false)
          };

          this.elementValuesToInsert[this.elementValuesToInsert.length] = getInOrderValues(element, columnsToInsert);

          return callback(null, null); //We have to push something to keep the stream moving...
        } else {
          //Add this element to the batch
          this.elementValuesToInsert[this.elementValuesToInsert.length] = getInOrderValues(element, columnsToInsert);

          //Do the batch INSERT if we have hit the batch limit
          if (this.elementValuesToInsert.length === batchAmount) {
            dbInstance.query(this.dbInfo.insertSql, {
              replacements: _.flatten(that.elementValuesToInsert),
              type: dbInstance.QueryTypes.INSERT
            })
            .then(function() {
              that.elementValuesToInsert = []; //reset for next batch
              return callback(null, null);
            })
            .catch(function(err) {
              databasePlugin.ETL.logger.error('Invalid INSERT request:', err);
              throw new Error(err);
            });
          } else {
            //That one was added to the batch, lets move to the next.
            return callback(null, null);
          }
        }
      }
    }

    //FIXME: Right now sortOut method is not properly sending the end signal that should come from sending a final null element.
    //This means that if you go from sortOut to Insert and have some leftover elementValuesToInsert that didn't quite met
    //the final batchAmount then they would not be inserted.  We'll use the flush function to force the last bacth in. This
    //is not a great end solution because the user may want to immediately select these back out, join against then, etc and
    //flush is not called until the entire stream has ended.  Good enough for benchmarking...
    function bulkFlush() {
      var that = this;

      if (_.isArray(this.elementValuesToInsert) && this.elementValuesToInsert.length > 0) {
        //We can't use the original batch statement becauase the value count is different
        var lastInsertSql = databasePlugin.getBoilerplateStreamBulkInsertStatement(tableName, this.dbInfo.sampleElement, this.elementValuesToInsert.length, false);

        dbInstance.query(lastInsertSql, {
          replacements: _.flatten(that.elementValuesToInsert),
          type: dbInstance.QueryTypes.INSERT
        })
        .then(function() {
          console.log("Forcing insert flush!");
          that.elementValuesToInsert = null; //done, clear it
        })
        .catch(function(err) {
          databasePlugin.ETL.logger.error('Invalid INSERT request:', err);
          throw new Error(err);
        });
      }
    }

    return databasePlugin.buildStreamTransform(processStreamInput, bulkFlush, 'standard');
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
  joinQuery: function(dbName, sqlStatement, returnedUnmatched = true, joinColumnsToReturn = []) {
    let dbInstance = getInstance(dbName);

    var streamFunction = function(element, encoding, callback) {
      var that = this;

      if (_.isEmpty(element)) {
        this.push(element);
        return callback();
      } else {
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
            //They want the original element back even though there is no matching join. Add the missing
            //properties and set each to null (like an outer join).
            if (_.isArray(joinColumnsToReturn) && joinColumnsToReturn.length > 0) {
               joinColumnsToReturn.map(c => element[c] = null);
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
        })
        .catch(function(err) {
          databasePlugin.ETL.logger.error('Invalid join/lookup request:', err);
        });
      }
    };

    //This is kind of like a map, except through2-map doesn't allow us to remmove
    //elements from the stream (i.e.) that.push(null);
    return databasePlugin.buildStreamTransform(streamFunction, null, 'standard');
  }

};

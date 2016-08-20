'use strict';

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _pluginUtils = require('../pluginUtils');

var _pluginUtils2 = _interopRequireDefault(_pluginUtils);

var _eachOfLimit = require('async/eachOfLimit');

var _eachOfLimit2 = _interopRequireDefault(_eachOfLimit);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var connectionInstances = {},
    queryLogging,
    enableQueryLogging = true; /**
                                * Mixes in methods used to work with a database
                                *
                                * @class Nextract.Plugins.Core.Database
                                */

queryLogging = enableQueryLogging === false ? false : sequelizeQueryLogging;

//Sequelize expects a function for logging or false for no logging
function sequelizeQueryLogging(sql) {
  _pluginUtils2.default.logger.info('SQL Debugging:', sql);
}

function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  var dbpluginConfig = _pluginUtils2.default.config.databases[dbName];

  connectionInstances[dbName] = new _sequelize2.default(dbpluginConfig.name, dbpluginConfig.user, dbpluginConfig.password, {
    host: dbpluginConfig.host,
    dialect: dbpluginConfig.dialect,
    searchPath: (0, _has3.default)(dbpluginConfig, 'searchPath') ? dbpluginConfig.searchPath : '',
    dialectOptions: {
      prependSearchPath: (0, _has3.default)(dbpluginConfig, 'dialectOptions') && (0, _has3.default)(dbpluginConfig.dialectOptions, 'prependSearchPath') ? dbpluginConfig.dialectOptions.searchPath : ''
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
  if ((0, _has3.default)(connectionInstances, dbName) === false) {
    buildNewConnection(dbName);
  }

  return connectionInstances[dbName];
}

//Method used in conjuction with runMany.  Takes an incoming collection and set of
//filter criteria and creates an object with the necessary extra sql and sql replacement
//params for each item in the collect.  Expects filterCriteria in the following format:
//(e.g.) var filterCriteria = [{ tableColumn: '', comparator: '', collectionField: '' }];
function buildSqlObjectsForCollectionWithFilterCriteria(collection, filterCriteria) {
  var sqlObjects = [];

  collection.forEach(function (element) {
    var extraSql = '',
        sqlParams = {};

    filterCriteria.forEach(function (fc, index) {
      if (index > 0) {
        extraSql += ' AND ';
      }

      extraSql += fc.tableColumn + fc.comparator + ':' + fc.collectionField;
      sqlParams[fc.collectionField] = element[fc.collectionField];
    });

    sqlObjects[sqlObjects.length] = {
      sql: extraSql,
      sqlParams: sqlParams
    };
  });

  return sqlObjects;
}

//Collection can have many rows resulting in the need to execute multiple queries.  This method
//handles of the running of many async functions with a configurable max amount to run in parallel.
//TODO: We should probably implement batch updates and inserts for performance gains
function runMany(dbName, queryType, baseQuery, collection, filterCriteria, maxParallelQueries) {
  return new Promise(function (resolve, reject) {
    var dbInstance = getInstance(dbName);
    var sqlObjects = buildSqlObjectsForCollectionWithFilterCriteria(collection, filterCriteria);

    (0, _eachOfLimit2.default)(sqlObjects, maxParallelQueries, function (element) {
      dbInstance.query(baseQuery + element.sql, {
        replacements: element.sqlParams,
        type: dbInstance.QueryTypes[queryType]
      }).catch(function (err) {
        _pluginUtils2.default.logger.error(err);
        reject(err);
      });
    }, function (err) {
      if (err) {
        _pluginUtils2.default.logger.error('Invalid ' + queryType + ' request:', err);
        reject('Invalid ' + queryType + ' request:', err);
      } else {
        //All queries are done
        resolve();
      }
    });
  });
}

module.exports = {

  /**
   * Raw query interface for select statements
   *
   * @method selectQuery
   * @example
   *     var sql = 'select first_name, last_name, age, salary from users where id = :id';
   *     var sqlParams = { id: id };
   *     ETL.Plugins.Core.Database.select('dbname', sql, sqlParams);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} sql SQL statement to execute. Can be a fully formed SQL select statement or
   * a parameterized one with ":key" placeholders. If the later, then sqlParams
   * must be an object of key/values to be replaced.
   * @param {Object} sqlParams (optional) List of key/value params to be subbed out in a parameterized query
   * @return {Promise} Promise resolved with an array of database rows that match the given select statement
   */
  selectQuery: function selectQuery(dbName, sql) {
    var sqlReplacements = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var dbInstance = getInstance(dbName);

    return dbInstance.query(sql, {
      replacements: sqlReplacements,
      type: dbInstance.QueryTypes.SELECT
    }).then(function (data) {
      return data;
    }).catch(function (err) {
      console.log(err);
    });
  },

  /**
   * Delete query executed for each row in the collection
   *
   * @method deleteQuery
   * @example
   *     var filterCriteria = [
   *      { tableColumn: 'first_name', comparator: '=', collectionField: 'first_name' },
   *      { tableColumn: 'last_name', comparator: '=', collectionField: 'last_name' }
   *     ];
   *
   *     return ETL.Plugins.Core.Database.deleteQuery('nextract_sample', 'users', userData, filterCriteria);
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} tableName Table name
   * @param {Array}  collection The collection to iterate on
   * @param {Array} filterCriteria Array of objects with key/value params to be subbed out in a
   * parameterized query. The expected format is  [{ tableColumn: '', comparator: '', collectionField: '' }].
   * @param {Integer}  maxParallelQueries (optional) Max number of queries to run in parallel (defaults to 5)
   * @return {Promise} Promise resolved once all queries have completed
   */
  deleteQuery: function deleteQuery(dbName, tableName, collection) {
    var filterCriteria = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];
    var maxParallelQueries = arguments.length <= 4 || arguments[4] === undefined ? 5 : arguments[4];

    var baseQuery = 'DELETE FROM ' + tableName + ' WHERE ';

    return runMany(dbName, 'DELETE', baseQuery, collection, filterCriteria, maxParallelQueries);
  },

  //Execute query for each row in the stream
  joinQuery: function joinQuery() {},

  //Lookup values in db using field values from the stream
  lookupQuery: function lookupQuery() {}

};

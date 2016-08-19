'use strict';

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

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
  console.log(sql);
}

function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  var dbpluginConfig = _default2.default.databases[dbName];

  connectionInstances[dbName] = new _sequelize2.default(dbpluginConfig.name, dbpluginConfig.user, dbpluginConfig.password, {
    host: dbpluginConfig.host,
    dialect: dbpluginConfig.dialect,
    //searchPath: "",
    //dialectOptions: {
    //prependSearchPath: true
    //},
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

module.exports = {

  /**
   * Raw query interface for select statements
   *
   * @method select
   * @example
   *     ETL.Plugins.Core.Database.select('dbname', 'select * from tablename');
   *
   * @param {String} dbName A database name that matches a object key defined in your Nextract config file
   * @param {String} sql SQL statement to execute. Can be a fully formed SQL statement or
   * a parameterized one with "?" placeholders. If the later, then sqlParams
   * must be an array of values to be replaced in order.
   * @param {Array} sqlParams (optional) List of params to be subbed as a parameterized query
   * @return {Promise} Promise resolved with an array of database rows that match the given select statement
   */
  select: function select(dbName, sql, sqlParams) {
    if (!(0, _isArray3.default)(sqlParams)) {
      sqlParams = [];
    }

    var dbInstance = getInstance(dbName);

    //Build and run raw/binded SQL statement
    //(eg) "SELECT * FROM ddm.app_filters WHERE app_guid = :app_guid"
    return dbInstance.query(sql, {
      //replacements: {
      //  app_guid: appGuid
      //},
      //type: sequelizeORM.sequelize.QueryTypes.SELECT
      type: dbInstance.QueryTypes.SELECT
    }).then(function (data) {
      return data;
    }).catch(function (err) {
      console.log(err);
    });
  },

  //Execute query for each row in the stream
  join: function join() {},

  //Lookup values in db using field values from the stream
  lookup: function lookup() {}

};

/**
 * Custom module used to operate on databases...
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var _            = require('lodash'),
    path         = require('path'),
    pluginConfig = require(path.resolve(__dirname, '../config/default')),
    Sequelize    = require('sequelize');

var connectionInstances = {},
    queryLogging,
    enableQueryLogging = true;

queryLogging = (enableQueryLogging === false) ? false : sequelizeQueryLogging;

//Sequelize expects a function for logging or false for no logging
function sequelizeQueryLogging(sql) {
  console.log(sql);
}

function buildNewConnection(dbName) {
  //TODO: add error handling if db does not exist in pluginConfig
  var dbpluginConfig = pluginConfig.databases[dbName];

  connectionInstances[dbName] = new Sequelize(dbpluginConfig.name, dbpluginConfig.user, dbpluginConfig.password, {
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
  if (_.has(connectionInstances, dbName) === false) {
    buildNewConnection(dbName);
  }

  return connectionInstances[dbName];
}

module.exports = {

  //Executes a SQL statement.  Can be a fully formed SQL statement or
  //a parameterized one with "?" placeholders.  If the later, then sqlParams
  //should be an array of values tp be replaced in order.
  query: function(dbName, sql, sqlParams) {
    if (!_.isArray(sqlParams)) {
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
    })
    .then(function(data) {
      return data;
    })
    .catch(function(err) {
      console.log(err);
    });
  },

  //Execute query for each row in the stream
  join: function() {

  },

  //Lookup values in db using field values from the stream
  lookup: function() {

  }

};

/**
 * Mixes in methods used to work with a database
 *
 * @class Nextract.Plugins.Core.Database
 */

import _ from 'lodash';
import { has, isArray } from 'lodash/fp';
import path from 'path';
import pluginConfig from '../config/default';
import Sequelize from 'sequelize';


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
  select: function(dbName, sql, sqlParams) {
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

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
  let dbpluginConfig = pluginConfig.databases[dbName];

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
  select: function(dbName, sql, sqlReplacements = {}) {
    let dbInstance = getInstance(dbName);

    return dbInstance.query(sql, {
      replacements: sqlReplacements,
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

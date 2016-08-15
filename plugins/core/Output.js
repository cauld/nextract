/**
 * Custom module used to export files
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var _           = require('lodash'),
    jsonfile    = require('jsonfile'),
    fs          = require('fs'),
    csv         = require('csv'),
    pluginBase  = require('../pluginBase');

//TODO: Allow for custom config object with csv-stringify settings...
function writeTextFile(filePath, data) {
  return new Promise(function (resolve, reject) {
    if (!_.isEmpty(data)) {
      var csvConfig = {};

      if (_.isObject(data[0])) {
        //We have an array of objects with key/value pairs so we
        //can use this to a header row.
        csvConfig.columns = Object.keys(data[0]);
        csvConfig.header = true;
      }

      //Ref: http://csv.adaltas.com/stringify/
      csv.stringify(data, csvConfig, function(err, output) {
        if (err) {
          pluginBase.logger.error('writeTextFile', err);
          reject(err);
        }

        fs.writeFile(filePath, output, function (err) {
          if (err) {
            pluginBase.logger.error('writeTextFile', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } else {
      pluginBase.logger.error('writeTextFile', 'Input data is empty!');
      reject('Input data is empty!');
    }
  });
}

//Ref: https://www.npmjs.com/package/jsonfile
function writeJsonFile(filePath, data, formattingConfig) {
  return new Promise(function (resolve, reject) {
    if (!_.isEmpty(data)) {
      //TODO: switch to es6 defaults here...
      formattingConfig = _.isObject(formattingConfig) ? formattingConfig : {};
      formattingConfig.spaces = _.has(formattingConfig, 'spaces') && _.isInteger(formattingConfig.spaces) ? formattingConfig.spaces : 0;

      jsonfile.writeFile(filePath, { "data": data }, formattingConfig, function (err) {
        if (err) {
          pluginBase.logger.error('writeJsonFile', err);
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      pluginBase.logger.error('writeTextFile', 'Input data is empty!');
      reject('Input data is empty!');
    }
  });
}

module.exports = {

  //TODO: Implement...
  /*
    Excel
  */

  writeFile: function(fileType, filePath, data, formattingConfig) {
    if (fileType === 'json') {
      return writeJsonFile(filePath, data, formattingConfig);
    } else {
      return writeTextFile(filePath, data, formattingConfig);
    }
  }

};

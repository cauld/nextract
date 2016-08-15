/**
 * Custom module used to import data
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var jsonfile    = require('jsonfile'),
    fs          = require('fs'),
    csv         = require('csv'),
    pluginBase  = require('../pluginBase');

function readJsonFile(filePath) {
  return new Promise(function (resolve, reject) {
    jsonfile.readFile(filePath, function(err, fileData) {
      console.log("fileData", fileData);

      if (err) {
        pluginBase.logger.error('readJsonFile', err);
        reject(err);
      } else {
        resolve(fileData);
      }
    });
  });
}

function readTextFile(filePath) {
  return new Promise(function (resolve, reject) {
    //Read the contents of the file into memory
    fs.readFile(filePath, function (err, fileData) {
      if (err) {
        pluginBase.logger.error('readTextFile', err);
        reject(err);
      }

      //Convert buffer to string
      var input = fileData.toString();

      //Ref: http://csv.adaltas.com/parse/
      csv.parse(input, { delimiter: ',', columns: true }, function(err, output) {
        if (err) {
          pluginBase.logger.error('readTextFile csv parse', err);
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  });
}

module.exports = {

  //TODO: Implement...
  /*
    Excel
  */

  readFile: function(fileType, filePath) {
    if (fileType === 'json') {
      return readJsonFile(filePath);
    } else {
      return readTextFile(filePath);
    }
  }

};

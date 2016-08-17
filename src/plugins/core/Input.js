/**
 * Mixes in methods used to read files
 *
 * @class Nextract.Plugins.Core.Input
 */

var jsonfile    = require('jsonfile'),
    fs          = require('fs'),
    csv         = require('csv'),
    pluginUtils = require('../pluginUtils');

function readJsonFile(filePath) {
  return new Promise(function (resolve, reject) {
    jsonfile.readFile(filePath, function(err, fileData) {
      console.log("fileData", fileData);

      if (err) {
        pluginUtils.logger.error('readJsonFile', err);
        reject(err);
      } else {
        resolve(fileData);
      }
    });
  });
}

//TODO: Implement with https://www.npmjs.com/package/excel-data
function readExcelFile(filePath) {
  return new Promise(function (resolve, reject) {

    reject('Not implemented yet!');

  });
}

function readCsvFile(filePath) {
  return new Promise(function (resolve, reject) {
    //Read the contents of the file into memory
    fs.readFile(filePath, function (err, fileData) {
      if (err) {
        pluginUtils.logger.error('readTextFile', err);
        reject(err);
      }

      //Convert buffer to string
      var input = fileData.toString();

      //Ref: http://csv.adaltas.com/parse/
      csv.parse(input, { delimiter: ',', columns: true }, function(err, output) {
        if (err) {
          pluginUtils.logger.error('readTextFile csv parse', err);
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  });
}

module.exports = {

  /**
   * Used to read files
   *
   * @method readFile
   * @example
   *     ETL.Plugins.Core.Input.readFile('json', sampleUsersInputFilePath);
   *
   * @param {String} fileType Type of file to write; json, csv, or excel
   * @param {String} filePath Full path of file to read (include filename and extension)
   */
  readFile: function(fileType, filePath) {
    switch (fileType) {
      case 'csv':
        return readCsvFile(filePath);
      case 'json':
        return readJsonFile(filePath);
      case 'excel':
        return readExcelFile(filePath);
      default:
        return new Promise.reject("Invalid file type given in readFile!");
    }
  }

};

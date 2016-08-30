/**
 * Mixes in methods used to read files
 *
 * @class Nextract.Plugins.Core.Input
 */

/*
TODO:
1) Migrate to setupTaskEngine, startTask, endTask format
2) Implement excel
*/

import jsonfile from 'jsonfile';
import fs from 'fs';
import csv from 'csv';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
var inputPlugin = new pluginBase('Input', 'Core');

function readJsonFile(filePath) {
  return new Promise(function (resolve, reject) {
    jsonfile.readFile(filePath, function(err, fileData) {
      if (err) {
        inputPlugin.logger.error('readJsonFile', err);
        reject(err);
      } else {
        resolve(fileData);
      }
    });
  });
}

//TODO: Implement. Perhaps with https://www.npmjs.com/package/excel-data.
function readExcelFile(filePath) {
  return new Promise(function (resolve, reject) {

    reject('Not implemented yet!');

  });
}

//TODO: Make this stream... see - http://csv.adaltas.com/parse/examples/
function readCsvFile(filePath, parserConfig = { delimiter: ',', columns: true }) {
  return new Promise(function (resolve, reject) {
    //Read the contents of the file into memory
    fs.readFile(filePath, function (err, fileData) {
      if (err) {
        inputPlugin.logger.error('readTextFile', err);
        reject(err);
      }

      //Convert buffer to string
      var input = fileData.toString();

      //Ref: http://csv.adaltas.com/parse/
      csv.parse(input, parserConfig, function(err, output) {
        if (err) {
          inputPlugin.logger.error('readTextFile csv parse', err);
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
   * @param {Object} parserConfig If fileType is "csv" then you can also pass a
   * parsing definition to handle the specific needs of your csv. If noe custom parserConfig
   * is given then a default config of { delimiter: ',', columns: true } is used. The parserConfig
   * object allow all paser options supported by cvs-parse (http://csv.adaltas.com/parse/).
   */
  readFile: function(fileType, filePath, parserConfig = null) {
    switch (fileType) {
      case 'csv':
        return readCsvFile(filePath, parserConfig);
      case 'json':
        return readJsonFile(filePath);
      case 'excel':
        return readExcelFile(filePath);
      default:
        return new Promise.reject("Invalid file type given in readFile!");
    }
  }

};

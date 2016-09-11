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

//Returns csv rows as a stream of objects
function readCsvFile(filePath, parserConfig = { delimiter: ',', columns: true }) {
  var parser,
      input;

  parser = csv.parse(parserConfig);
  input = fs.createReadStream(filePath);

  function processStreamInput(element, encoding, callback) {
    callback(null, element);
  }

  function inputFlush(callback) {
    //Trying to force an end of data notifcation... doesn't work!
    this.push(null);
    parser.end();

    callback();
  }

  return input.pipe(parser).pipe(inputPlugin.buildStreamTransform(processStreamInput, inputFlush, 'standard'));
  //return input.pipe(parser);
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
   * parsing definition to handle the specific needs of your csv. If no custom parserConfig
   * is given then a default config of { delimiter: ',', columns: true } is used. The parserConfig
   * object allow all paser options supported by cvs-parse (http://csv.adaltas.com/parse/).
   */
  readFile: function(fileType, filePath, parserConfig = null) {
    switch (fileType) {
      case 'csv':
        if (parserConfig === null) {
          //Don't pass null along since readCsvFile has a more proper default when not overridden
          return readCsvFile(filePath);
        } else {
          return readCsvFile(filePath, parserConfig);
        }
      case 'json':
        return readJsonFile(filePath);
      case 'excel':
        return readExcelFile(filePath);
      default:
        return new Promise.reject("Invalid file type given in readFile!");
    }
  }

};

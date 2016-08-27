/**
 * Mixes in methods used to export files
 *
 * @class Nextract.Plugins.Core.Output
 */

 /*
TODO:
1) Migrate to setupTaskEngine, startTask, endTask format
2) Implement excel
*/

import _ from 'lodash';
import { isEmpty } from 'lodash/fp';
import jsonfile from 'jsonfile';
import fs from 'fs';
import csv from 'csv';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
var outputPlugin = new pluginBase('Input', 'Core');

function writeCsvFile(filePath, data, formattingConfig = {}) {
  return new Promise(function (resolve, reject) {
    if (!_.isEmpty(data)) {
      //Ref: http://csv.adaltas.com/stringify/
      csv.stringify(data, formattingConfig, function(err, output) {
        if (err) {
          outputPlugin.logger.error('writeTextFile', err);
          reject(err);
        }

        fs.writeFile(filePath, output, function (err) {
          if (err) {
            outputPlugin.logger.error('writeTextFile', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } else {
      outputPlugin.logger.error('writeCsvFile', 'Input data is empty!');
      reject('Input data is empty!');
    }
  });
}

//TODO: Implement with https://www.npmjs.com/package/excel4node
function writeExcelFile(filePath, data, formattingConfig = {}) {
  return new Promise(function (resolve, reject) {

    //Can remove console.log once implemented, just preventing ununsed var build error
    console.log(formattingConfig);

    reject('Not implemented yet!');

  });
}

//Ref: https://www.npmjs.com/package/jsonfile
function writeJsonFile(filePath, data, formattingConfig = {}) {
  return new Promise(function (resolve, reject) {
    if (!_.isEmpty(data)) {
      jsonfile.writeFile(filePath, { "data": data }, formattingConfig, function (err) {
        if (err) {
          outputPlugin.logger.error('writeJsonFile', err);
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      outputPlugin.logger.error('writeJsonFile', 'Input data is empty!');
      reject('Input data is empty!');
    }
  });
}

module.exports = {

  /**
   * Used to output files
   *
   * @method writeFile
   * @example
   *     ETL.Plugins.Core.Output.writeFile('csv', "path/to/file.csv", { header: true }, data);
   *
   * @param {String} fileType Type of file to write; json, csv, or excel
   * @param {Array} data An array of objects to be wrtten to the file
   * @param {String} filePath Full path of file to write (include filename and extension)
   * @param {Object} formattingConfig Object contain config options for the file type being written.
   * 1) If cvs - all options allowed by cvs-stringify (http://csv.adaltas.com/stringify/) are supported
   * 2) If json - the only option is formatting with X number of spaces (e.g.) {spaces: 2}
   * 3) If excel - see https://www.npmjs.com/package/excel4node
   */
  writeFile: function(fileType, data, filePath, formattingConfig) {
    switch (fileType) {
      case 'csv':
        return writeCsvFile(filePath, data, formattingConfig);
      case 'json':
        return writeJsonFile(filePath, data, formattingConfig);
      case 'excel':
        return writeExcelFile(filePath, data, formattingConfig);
      default:
        return new Promise.reject("Invalid file type given in writeFile!");
    }
  }

};

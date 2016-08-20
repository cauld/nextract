'use strict';

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _csv = require('csv');

var _csv2 = _interopRequireDefault(_csv);

var _pluginUtils = require('../pluginUtils');

var _pluginUtils2 = _interopRequireDefault(_pluginUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixes in methods used to export files
 *
 * @class Nextract.Plugins.Core.Output
 */

function writeCsvFile(filePath, data) {
  var formattingConfig = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise(function (resolve, reject) {
    if (!(0, _isEmpty3.default)(data)) {
      //Ref: http://csv.adaltas.com/stringify/
      _csv2.default.stringify(data, formattingConfig, function (err, output) {
        if (err) {
          _pluginUtils2.default.logger.error('writeTextFile', err);
          reject(err);
        }

        _fs2.default.writeFile(filePath, output, function (err) {
          if (err) {
            _pluginUtils2.default.logger.error('writeTextFile', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } else {
      _pluginUtils2.default.logger.error('writeCsvFile', 'Input data is empty!');
      reject('Input data is empty!');
    }
  });
}

//TODO: Implement with https://www.npmjs.com/package/excel4node
function writeExcelFile(filePath, data) {
  var formattingConfig = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise(function (resolve, reject) {

    //Can remove one implemented, just prevent ununsed var build error
    console.log(formattingConfig);

    reject('Not implemented yet!');
  });
}

//Ref: https://www.npmjs.com/package/jsonfile
function writeJsonFile(filePath, data) {
  var formattingConfig = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise(function (resolve, reject) {
    if (!(0, _isEmpty3.default)(data)) {
      _jsonfile2.default.writeFile(filePath, { "data": data }, formattingConfig, function (err) {
        if (err) {
          _pluginUtils2.default.logger.error('writeJsonFile', err);
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      _pluginUtils2.default.logger.error('writeJsonFile', 'Input data is empty!');
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
  writeFile: function writeFile(fileType, data, filePath, formattingConfig) {
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

'use strict';

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _csv = require('csv');

var _csv2 = _interopRequireDefault(_csv);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
/**
 * Mixes in methods used to export files
 *
 * @class Nextract.Plugins.Core.Output
 */

/*
TODO:
2) Implement excel writer
*/

var outputPlugin = new _pluginBase2.default('Input', 'Core');

//Ref: https://www.npmjs.com/package/jsonfile
function writeJsonFile(filePath, data) {
  var formattingConfig = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise(function (resolve, reject) {
    if (!(0, _isEmpty3.default)(data)) {
      _jsonfile2.default.writeFile(filePath, { "data": data }, formattingConfig, function (err) {
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
   * Converts stream objects to csv strings (usually paired with toFile).
   *
   * @method toCsvString
   * @for Nextract.Plugins.Core.Output
   *
   * @example
   *     var formattingConfig = { headers: true, columns: { first_name: 'first_name', last_name: 'last_name', ... } };
   * @example
   *     transform.Plugins.Core.Output.toCsvString(formattingConfig);
   *
   * @param {Object} formattingConfig Object contain config options for the file type being written.
   * All options allowed by cvs-stringify (http://csv.adaltas.com/stringify/) are supported.
   */
  //Ref: http://csv.adaltas.com/stringify/examples/
  toCsvString: function toCsvString() {
    var formattingConfig = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var stringifier = _csv2.default.stringify(formattingConfig);

    return outputPlugin.getStreamPassthroughForPipe().pipe(stringifier);
  },

  /**
   * Writes stream to a file (usually preceeded by a call to toCsv, toExcel, toJSON, etc).
   *
   * @method toFile
   * @for Nextract.Plugins.Core.Output
   *
   * @example
   *     var outputFilePath = '/path/to/file.extension';
   * @example
   *     transform.Plugins.Core.Output.toFile(outputFilePath);
   *
   * @param {Object} formattingConfig Object contain config options for the file type being written.
   * All options allowed by cvs-stringify (http://csv.adaltas.com/stringify/) are supported.
   */
  toFile: function toFile(filePath) {
    var writeStream = _fs2.default.createWriteStream(filePath);

    return outputPlugin.getStreamPassthroughForPipe().pipe(writeStream);
  }

};

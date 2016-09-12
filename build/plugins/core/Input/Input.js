'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _csv = require('csv');

var _csv2 = _interopRequireDefault(_csv);

var _JSONStream = require('JSONStream');

var _JSONStream2 = _interopRequireDefault(_JSONStream);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
/**
 * Mixes in methods used to read files
 *
 * @class Nextract.Plugins.Core.Input
 */

/*
TODO:
1) Implement excel
*/

var inputPlugin = new _pluginBase2.default('Input', 'Core');

module.exports = {

  /**
   * Streams in a CSV file
   *
   * @method readCsvFile
   * @example
   *     ETL.Plugins.Core.Input.readCsvFile(filePath, parserConfig);
   *
   * @param {String} fileType Type of file to write; json, csv, or excel
   * @param {String} filePath Full path of file to read (include filename and extension)
   * @param {Object} parserConfig If fileType is "csv" then you can also pass a
   * parsing definition to handle the specific needs of your csv. If no custom parserConfig
   * is given then a default config of { delimiter: ',', columns: true } is used. The parserConfig
   * object allow all paser options supported by cvs-parse (http://csv.adaltas.com/parse/).
   */
  readCsvFile: function readCsvFile(filePath) {
    var parserConfig = arguments.length <= 1 || arguments[1] === undefined ? { delimiter: ',', columns: true } : arguments[1];

    var parser, input;

    parser = _csv2.default.parse(parserConfig);
    input = _fs2.default.createReadStream(filePath);

    function processStreamInput(element, encoding, callback) {
      callback(null, element);
    }

    function inputFlush(callback) {
      //Trying to force an end of data notification... doesn't work!
      this.push(null);
      parser.end();

      callback();
    }

    return input.pipe(parser).pipe(inputPlugin.buildStreamTransform(processStreamInput, inputFlush, 'standard'));
  },

  /**
   * Streams in a JSON file
   *
   * @method readJsonFile
   * @example
   *     ETL.Plugins.Core.Input.readJsonFile(filePath, pathToParse);
   *
   * @param {String} filePath Full path of file to read (include filename and extension)
   * @param {Object} pathToParse Parses stream of values that match a path. To understand this format of
   * this param place see the following doc - https://www.npmjs.com/package/JSONStream#jsonstreamparsepath.
   */
  readJsonFile: function readJsonFile(filePath, pathToParse) {
    var jsonStream, jsonParser;

    jsonStream = _fs2.default.createReadStream(filePath, { encoding: 'utf8' });
    jsonParser = _JSONStream2.default.parse('data.employees.*');

    return jsonStream.pipe(jsonParser);
  },

  //TODO: Implement...
  readExcelFile: function readExcelFile() {}

};

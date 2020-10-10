"use strict";
/**
 * Mixes in methods used to read files
 *
 * @class Nextract.Plugins.Core.Input
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
TODO:
1) Implement excel
*/
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = __importDefault(require("csv-parse"));
const JSONStream_1 = __importDefault(require("JSONStream"));
const pluginBase_1 = __importDefault(require("../../pluginBase"));
//Instantiate the plugin
let inputPlugin = new pluginBase_1.default('Input', 'Core');
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
    readCsvFile: function (filePath, parserConfig = { delimiter: ',', columns: true }) {
        let parser, input;
        parser = csv_parse_1.default(parserConfig);
        input = fs_1.default.createReadStream(filePath);
        function processStreamInput(element, encoding, callback) {
            callback(null, element);
        }
        return input.pipe(parser).pipe(inputPlugin.buildStreamTransform(processStreamInput, null, 'standard'));
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
    readJsonFile: function (filePath, pathToParse) {
        let jsonStream, jsonParser;
        jsonStream = fs_1.default.createReadStream(filePath, { encoding: 'utf8' });
        jsonParser = JSONStream_1.default.parse(pathToParse); //'data.employees.*'
        return jsonStream.pipe(jsonParser);
    },
    //TODO: Implement...
    readExcelFile: function () { }
};

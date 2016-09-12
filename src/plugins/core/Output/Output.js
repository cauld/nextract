/**
 * Mixes in methods used to export files
 *
 * @class Nextract.Plugins.Core.Output
 */

 /*
TODO:
2) Implement excel writer
*/

import _ from 'lodash';
import { isEmpty } from 'lodash/fp';
import jsonfile from 'jsonfile';
import fs from 'fs';
import csv from 'csv';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
var outputPlugin = new pluginBase('Input', 'Core');


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
  toCsvString: function(formattingConfig = {}) {
    var stringifier = csv.stringify(formattingConfig);

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
  toFile: function(filePath) {
    var writeStream = fs.createWriteStream(filePath);

    return outputPlugin.getStreamPassthroughForPipe().pipe(writeStream);
  }

};

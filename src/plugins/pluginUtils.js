/**
 * Plugin utils useful when building plugins
 *
 * @class Nextract.pluginUtils
 */

import config from './config/default';
import * as logger from './core/Logger/Logger';
import fs from 'fs';
import path from 'path';
import Worker from 'workerjs';

module.exports = {

  /**
   * Provides access to the current config from inside a plugin. Useful if a plugin requires access to
   * dynamic configuration details (e.g.) the database plugin uses this to lookup database creds
   * for a given database name.
   *
   * @method config
   * @for Nextract.pluginUtils
   *
   * @return {Promise} Promise resolved with current Nextract config object
   */
  config: config,

  /**
   * Provides access to the Core logger from inside a plugin
   *
   * @method logger
   * @for Nextract.pluginUtils
   *
   * @example
   *    pluginUtils.logger.error('Houston we have a problem', err);
   *
   * @return {Promise} Promise resolved with current Nextract config object
   */
  logger: logger,

  /**
   * Convinence method used by plugins to run code in a background web worker thread. A worker
   * script must exist in the same directory as the plugin itself with a name of Worker.js. The
   * format of the worker script must match the one defined in the Sort plugin for example
   * (see src/plugins/core/Sort/Worker.js);
   *
   * @method runInWorker
   * @for Nextract.pluginUtils
   *
   * @example
   *     var workerMsg = { cmd: 'orderBy', args: [collection, iteratees, orders] };
   *
   * @example
   *     return pluginUtils.runInWorker('Core', 'Sort', workerMsg);
   *
   * @param {String} pluginType Plugin type (Core or Vendor)
   * @param {String} pluginName Plugin name (e.g.) Sort
   * @param {Object} workerMsg The message to be passed to the worker. The object contains
   * two properties; 1) cmd - The command/method to run inside the Worker & 2) args - The
   * arguments being passed to the methiod defined in command via apply().
   *
   * @return {Promise} Promise resolved with an array of database rows that match the given select statement
   */
  runInWorker: function(pluginType, pluginName, workerMsg) {
    return new Promise(function (resolve, reject) {

      //Verify a web worker script for this plugin exists
      var workerScript = path.resolve(__dirname, './' + pluginType.toLowerCase() + '/' + pluginName + '/Worker.js');
      fs.stat(workerScript, function(err, stat) {
        if (err) {
          reject('Plugin worker file not found for', pluginName);
        } else {
          var worker = new Worker(workerScript, true);
          worker.onmessage = function(collection) {
            worker.terminate();
            resolve(collection);
          };

          worker.postMessage(workerMsg);
        }
      });
    });
  }

};

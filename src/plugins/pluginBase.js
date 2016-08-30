/**
 * The base plugin class that all plugins inherit from
 *
 * @class Nextract.PluginBase
 */

import config from './config/default';
import * as logger from './core/Logger/Logger';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { has, isArray } from 'lodash/fp';
import Worker from 'workerjs';
import through2 from 'through2';
import throughFilter from 'through2-filter';
import throughMap from 'through2-map';
import throughSpy from 'through2-spy';

var PluginBase = function(pluginName = null, pluginType = null) {
  var self = this;

  if (pluginName === null) {
    throw("A plugin name must be provided to initPlugin!");
  }

  if (pluginType === null) {
    throw("A plugin type (Core or Vendor) must be provided to initPlugin!");
  }

  /**
   * Plugin name
   *
   * @property pluginName
   * @for Nextract.PluginBase
   * @type String
   */
  this.pluginName = pluginName;

  /**
   * Plugin type (Core or Vendor)
   *
   * @property pluginType
   * @for Nextract.PluginBase
   * @type String
   */
  this.pluginType = pluginType;

  /**
   * Core system functionality is namespaced under this ETL object
   *
   * @property ETL
   * @for Nextract.PluginBase
   * @type Object
   */
  this.ETL = {
    /**
     * Provides convient access to the core system config variables
     *
     * @property ETL.config
     * @for Nextract.PluginBase
     * @type Object
     */
    config: config,

    /**
     * Provides convient access to core logging functionality
     *
     * @property ELT.logger
     * @for Nextract.PluginBase
     * @type Object
     */
    logger: logger
  };

  /**
   * Convinence method used by plugins to run code in a background web worker thread. A worker
   * script must exist in the same directory as the plugin itself with a name of Worker.js. The
   * format of the worker script must match the one defined by the npm workerjs module -
   * https://www.npmjs.com/package/workerjs#node-mode---allowing-require
   *
   * @method runInWorker
   * @for Nextract.PluginBase
   *
   * @example
   *     var workerMsg = { cmd: 'orderBy', args: [collection, iteratees, orders] };
   *
   * @example
   *     return pluginUtils.runInWorker(workerMsg);
   *
   * @param {Object} workerMsg The message to be passed to the worker (can be an object)
   *
   * @return {Promise} Promise resolved with worker response msg
   */
  this.runInWorker = function(workerMsg) {
    return new Promise(function (resolve, reject) {
      //Verify a web worker script for this plugin exists
      var workerScript = path.resolve(__dirname, './' + self.pluginType.toLowerCase() + '/' + self.pluginName + '/Worker.js');
      fs.stat(workerScript, function(err, stat) {
        if (err) {
          reject('Plugin worker file not found for', self.pluginName);
        } else {
          var worker = new Worker(workerScript, true);

          //Worker callback success handler
          worker.onmessage = function(workerResponse) {
            worker.terminate();
            resolve(workerResponse.data);
          };

          //Worker callback error handler
          worker.onerror = function(event) {
            worker.terminate();
            var rejectMsg = event.message + " (" + event.filename + ":" + event.lineno + ")";
            reject(rejectMsg);
          };

          worker.postMessage(workerMsg);
        }
      });
    });
  };

  /**
   * Accepts a stream transform function that conforms to the through2.obj stream wrapper
   * API. Caller can choose to use through2 or one of the through2 helper modules (map, filter, spy).
   * For more information see - https://github.com/rvagg/through2.
   *
   * @method buildStreamTransform
   * @for Nextract.PluginBase
   *
   * @example
   *     var streamFunction = function(element, index) { return element.foo <= 10 };
   * @example
   *     return pluginName.runTask('sometaskname', streamFunction, 'filter');
   *
   * @param {Function} streamFunction Function that conforms to the through2.obj stream wrapper API
   * @param {String} streamFunctionType (optional, defaults to standard through2) standard, filter, map, or spy
   *
   * @return {Function} Returns stream transform wrapped using through2
   */
  this.buildStreamTransform = function(streamFunction, streamFunctionType = 'standard') {
    var streamWrappedFunction;

    switch(streamFunctionType) {
      case 'filter':
        streamWrappedFunction = throughFilter.obj(streamFunction);
        break;
      case 'map':
        streamWrappedFunction = throughMap.obj(streamFunction);
        break;
      case 'spy':
        streamWrappedFunction = throughSpy.obj(streamFunction);
        break;
      default:
        streamWrappedFunction = through2.obj(streamFunction);
        break;
    }

    return streamWrappedFunction;
  };

};

module.exports = PluginBase;

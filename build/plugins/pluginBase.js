'use strict';

var _default = require('./config/default');

var _default2 = _interopRequireDefault(_default);

var _Logger = require('./core/Logger/Logger');

var logger = _interopRequireWildcard(_Logger);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _workerjs = require('workerjs');

var _workerjs2 = _interopRequireDefault(_workerjs);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _through2Filter = require('through2-filter');

var _through2Filter2 = _interopRequireDefault(_through2Filter);

var _through2Map = require('through2-map');

var _through2Map2 = _interopRequireDefault(_through2Map);

var _through2Spy = require('through2-spy');

var _through2Spy2 = _interopRequireDefault(_through2Spy);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PluginBase = function PluginBase() {
  var pluginName = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
  var pluginType = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

  var self = this;

  if (pluginName === null) {
    throw "A plugin name must be provided to initPlugin!";
  }

  if (pluginType === null) {
    throw "A plugin type (Core or Vendor) must be provided to initPlugin!";
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
    config: _default2.default,

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
  this.runInWorker = function (workerMsg) {
    return new Promise(function (resolve, reject) {
      //Verify a web worker script for this plugin exists
      var workerScript = _path2.default.resolve(__dirname, './' + self.pluginType.toLowerCase() + '/' + self.pluginName + '/Worker.js');
      _fs2.default.stat(workerScript, function (err, stat) {
        if (err) {
          reject('Plugin worker file not found for', self.pluginName);
        } else {
          var worker = new _workerjs2.default(workerScript, true);

          //Worker callback success handler
          worker.onmessage = function (workerResponse) {
            worker.terminate();
            resolve(workerResponse.data);
          };

          //Worker callback error handler
          worker.onerror = function (event) {
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
  this.buildStreamTransform = function (streamFunction) {
    var streamFunctionType = arguments.length <= 1 || arguments[1] === undefined ? 'standard' : arguments[1];

    var streamWrappedFunction;

    switch (streamFunctionType) {
      case 'filter':
        streamWrappedFunction = _through2Filter2.default.obj(streamFunction);
        break;
      case 'map':
        streamWrappedFunction = _through2Map2.default.obj(streamFunction);
        break;
      case 'spy':
        streamWrappedFunction = _through2Spy2.default.obj(streamFunction);
        break;
      default:
        streamWrappedFunction = _through2.default.obj(streamFunction);
        break;
    }

    return streamWrappedFunction;
  };
}; /**
    * The base plugin class that all plugins inherit from
    *
    * @class Nextract.PluginBase
    */

module.exports = PluginBase;

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
   * format of the worker script must match the one defined in the Sort plugin for example
   * (see src/plugins/core/Sort/Worker.js);
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
   * @param {Object} workerMsg The message to be passed to the worker. The object contains
   * two properties; 1) cmd - The command/method to run inside the Worker & 2) args - The
   * arguments being passed to the methiod defined in command via apply().
   *
   * @return {Promise} Promise resolved with collection
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
          worker.onmessage = function (collection) {
            worker.terminate();
            resolve(collection);
          };

          worker.postMessage(workerMsg);
        }
      });
    });
  };

  /**
   * Plugin tasks are a series of chained Promises. setupTaskEngine is used to start the chain.
   * Since the plugin instance itself is an object and not a promise we cannot immediately chain
   * (then) off it.
   *
   * @method runInWorker
   * @for Nextract.PluginBase
   *
   * @example
   *     pluginName.setupTaskEngine().then(...).then(...)
   *
   * @return {Promise} An immediately resolved Promise
   */
  this.setupTaskEngine = function () {
    return Promise.resolve(null);
  };

  /**
   * This should be the 2nd method called by a plugin (after setupTaskEngine) when
   * performing a task.  Takes care of internal proceses required when starting a new
   * starts.  Might be something as simple as logging or might be more complex.
   *
   * @method runInWorker
   * @for Nextract.PluginBase
   *
   * @example
   *     pluginName.setupTaskEngine().startTask("foo").then(...).then(...)
   *
   * @return {Promise} An immediately resolved Promise
   */
  this.startTask = function (taskName) {
    return new Promise(function (resolve) {
      self.ETL.logger.info(taskName, 'started for plugin', self.pluginName);
      resolve();
    });
  };

  /**
   * This should be the last method called by a plugin (after setupTaskEngine) when
   * done performing a task.  Takes care of internal proceses required when end a
   * task.  Might be something as simple as logging or might be more complex.
   *
   * @method endTask
   * @for Nextract.PluginBase
   *
   * @example
   *     pluginName.setupTaskEngine().startTask("foo").then(...).then(...)..endTask("foo")
   *
   * @return {Promise} An immediately resolved Promise
   */
  this.endTask = function (taskName) {
    return new Promise(function (resolve) {
      self.ETL.logger.info(taskName, 'ended for plugin', self.pluginName);
      resolve();
    });
  };
}; /**
    * The base plugin class that all plugins inherit from
    *
    * @class Nextract.PluginBase
    */

module.exports = PluginBase;

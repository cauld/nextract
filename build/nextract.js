'use strict';

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _forOwn2 = require('lodash/forOwn');

var _forOwn3 = _interopRequireDefault(_forOwn2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Logger = require('./plugins/core/Logger/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _through2Spy = require('through2-spy');

var _through2Spy2 = _interopRequireDefault(_through2Spy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Nextract = function Nextract(transformName) {
  var self = this;

  this.transformName = transformName;

  /**
   * Object containing references to the Core and Vendor plugins that have been loaded in the current program
   *
   * @property Plugins
   * @for Nextract
   * @type Object
   */
  this.Plugins = {
    /**
     * Object containing references to core plugins that have loaded in the current program
     *
     * @property Plugins.Core
     * @for Nextract
     * @type Object
     */
    Core: {},

    /**
     * Object containing references to vendor plugins that have loaded in the current program
     *
     * @property Plugins.Vendor
     * @for Nextract
     * @type Object
     */
    Vendor: {}
  };

  //Transforms will emit events during the stream flow. We must setup an event emitter here for
  //trasnforms to use. This allows us to track thing behind the scenes (e.g.) record counts in and out.
  this.transformEventData = {
    stepStreamCounts: {}
  };

  function TransformEmitter() {
    _events2.default.call(this);
  }
  _util2.default.inherits(TransformEmitter, _events2.default);
  this.transformEmitter = new TransformEmitter();

  //Setup any events listeners we care about here...
  this.transformEmitter.on('countStream', function (stepKey, countType) {
    if (!(0, _has3.default)(self.transformEventData.stepStreamCounts, stepKey)) {
      //Initialize this counter
      self.transformEventData.stepStreamCounts[stepKey] = { 'in': 0, 'out': 0 };
    }

    self.transformEventData.stepStreamCounts[stepKey][countType]++;
  });

  //Public Interface
  return {

    Plugins: this.Plugins,

    /**
     * Used to mixin the functionality of a core or 3rd party vendor ETL plugin. These
     * plugins are located in plugins/core & plugins/vendor.
     *
     * @method loadPlugins
     * @param {String} pluginTypes Type of plugin being imported (Core or Vendor)
     * @param {String | Array} pluginNames Plugin(s) to import
     */
    loadPlugins: this.mixin,

    /**
     * Used to count the number of items flowing into or out of a stream step.
     * Most often used before and after a transform task to see the impact of a task.
     *
     * @example
     *     someReadableStream.pipe(transform.countStream('Step1', 'in'))
     *      .pipe(transform.Plugins.Core.Filter.greaterThan('age', 30))
     *      .pipe(transform.countStream('Step1', 'out'))
     *
     * @method countStream
     * @param {String} stepKey A unique name for the step (shared by the in and out buckets)
     * @param {String} direction Valid values are "in" & "out"
     */
    countStream: function countStream(stepKey, direction) {
      return _through2Spy2.default.obj(function () {
        self.transformEmitter.emit('countStream', stepKey, direction);
      });
    },

    /**
     * Used to print a report that contains the in and out counts recorded
     * from countStream calls within a transform.
     *
     * @example
     *     transform.printStepProfilingReport();
     *
     * @method printStepProfilingReport
     *
     * @return Triggers a core logger plugin logger.info() call that dumps out the
     * contents of transformEventData.
     */
    printStepProfilingReport: function printStepProfilingReport() {
      (0, _forOwn3.default)(self.transformEventData.stepStreamCounts, function (o, stepName) {
        _Logger2.default.info(stepName, ':', o);
      });
    }

  };
}; /**
    * ETL class that all programs start from
    *
    * @class Nextract
    * @constructor
    */

Nextract.prototype.mixin = function (pluginType, pluginNames) {
  var that = this;

  return new Promise(function (resolve, reject) {
    pluginNames = (0, _isArray3.default)(pluginNames) ? pluginNames : [pluginNames];

    pluginNames.forEach(function (pluginName) {
      try {
        if (pluginType === 'Core' || pluginType === 'Vendor') {
          that.Plugins.Core[pluginName] = require(_path2.default.resolve(__dirname, 'plugins/' + pluginType.toLowerCase() + '/' + pluginName + '/' + pluginName));
        } else {
          reject('Invalid plugin type given, must be Core or Vendor!');
        }
      } catch (err) {
        _Logger2.default.error('Nextract mixin: ', err);
        reject(err);
      }
    });

    resolve();
  });
};

module.exports = Nextract;

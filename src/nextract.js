/**
 * ETL class that all programs start from
 *
 * @class Nextract
 * @constructor
 */

import _ from 'lodash';
import { has, isArray } from 'lodash/fp';
import path from 'path';
import logger from './plugins/core/Logger/Logger';
import EventEmitter from 'events';
import util from 'util';
import spy from 'through2-spy';

var Nextract = function(transformName) {
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
    EventEmitter.call(this);
  }
  util.inherits(TransformEmitter, EventEmitter);
  this.transformEmitter = new TransformEmitter();

  //Setup any events listeners we care about here...
  this.transformEmitter.on('countStream', function(stepKey, countType) {
    if (!_.has(self.transformEventData.stepStreamCounts, stepKey)) {
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
    countStream: function(stepKey, direction) {
      return spy.obj(function() {
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
    printStepProfilingReport: function() {
      _.forOwn(self.transformEventData.stepStreamCounts, function(o, stepName) {
        logger.info(stepName, ':', o);
      });
    }

  }

};

Nextract.prototype.mixin = function(pluginType, pluginNames) {
  var that = this;

  return new Promise(function (resolve, reject) {
    pluginNames = _.isArray(pluginNames) ? pluginNames : [pluginNames];

    pluginNames.forEach(function(pluginName) {
      try {
        if (pluginType === 'Core' || pluginType === 'Vendor') {
          that.Plugins.Core[pluginName] = require(path.resolve(__dirname, 'plugins/' + pluginType.toLowerCase() + '/' + pluginName + '/' + pluginName));
        } else {
          reject('Invalid plugin type given, must be Core or Vendor!');
        }
      } catch(err) {
        logger.error('Nextract mixin: ', err);
        reject(err);
      }
    });

    resolve();
  });
};

module.exports = Nextract;

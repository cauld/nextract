/**
 * ETL class that all programs start from
 *
 * @class Nextract
 * @constructor
 */

import { forOwn, has, isArray } from 'lodash/fp';
import path from 'path';
import logger from './plugins/core/Logger/Logger';
import spy from 'through2-spy';

import EventEmitter = require('events');

/**
 * Object containing references to the Core and Vendor plugins that have been loaded in the current program
 *
 * @property Plugins
 * @for Nextract
 * @type Object
 */
interface IPlugins {
  /**
   * Object containing references to core plugins that have loaded in the current program
   *
   * @property Plugins.Core
   * @for Nextract
   * @type Object
   */
  Core: any;

  /**
   * Object containing references to vendor plugins that have loaded in the current program
   *
   * @property Plugins.Vendor
   * @for Nextract
   * @type Object
   */
  Vendor: any;
}

class TransformEmitter extends EventEmitter {}

export default class Nextract {
  private transformEmitter: TransformEmitter;

  //Transforms will emit events during the stream flow. We must setup an event emitter here for
  //transforms to use. This allows us to track thing behind the scenes (e.g.) record counts in and out.
  private transformEventData: any = {
    stepStreamCounts: {}
  };

  transformName: string;
  
  Plugins: IPlugins = {
    Core: {},
    Vendor: {}
  };

  constructor(transformName: string) {
    this.transformName = transformName;
    this.transformEmitter = new TransformEmitter();

    //Setup any events listeners we care about here...
    this.transformEmitter.on('countStream', (stepKey, countType) => {
      if (!has(this.transformEventData.stepStreamCounts, stepKey)) {
        //Initialize this counter
        this.transformEventData.stepStreamCounts[stepKey] = { 'in': 0, 'out': 0 };
      }

      this.transformEventData.stepStreamCounts[stepKey][countType]++;
    });
  }

    /**
     * Loads the functionality of a core or 3rd party vendor ETL plugin. These
     * plugins are located in plugins/core & plugins/vendor.
     *
     * @method loadPlugins
     * @param {String} pluginTypes Type of plugin being imported (Core or Vendor)
     * @param {String | Array} pluginNames Plugin(s) to import
     */
    loadPlugins(pluginType, pluginNames) {
      return new Promise((resolve, reject) => {
        pluginNames = isArray(pluginNames) ? pluginNames : [pluginNames];
    
        pluginNames.forEach(function(pluginName) {
          try {
            if (pluginType === 'Core' || pluginType === 'Vendor') {
              this.Plugins.Core[pluginName] = require(path.resolve(__dirname, 'plugins/' + pluginType.toLowerCase() + '/' + pluginName + '/' + pluginName));
            } else {
              reject('Invalid plugin type given, must be Core or Vendor!');
            }
          } catch(err) {
            logger.error('Nextract loadPlugins: ', err);
            reject(err);
          }
        });
    
        resolve();
      });
    }

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
    countStream(stepKey, direction) {
      return spy.obj(() => {
        this.transformEmitter.emit('countStream', stepKey, direction);
      });
    }

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
    printStepProfilingReport = () => {
      forOwn(this.transformEventData.stepStreamCounts, function(o, stepName) {
        logger.info(stepName, ':', o);
      });
    }

}

"use strict";
/**
 * ETL class that all programs start from
 *
 * @class Nextract
 * @constructor
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("lodash/fp");
const path_1 = __importDefault(require("path"));
const Logger_1 = __importDefault(require("./plugins/core/Logger/Logger"));
const through2_spy_1 = __importDefault(require("through2-spy"));
const EventEmitter = require("events");
class TransformEmitter extends EventEmitter {
}
class Nextract {
    constructor(transformName) {
        //Transforms will emit events during the stream flow. We must setup an event emitter here for
        //transforms to use. This allows us to track thing behind the scenes (e.g.) record counts in and out.
        this.transformEventData = {
            stepStreamCounts: {}
        };
        this.Plugins = {
            Core: {},
            Vendor: {}
        };
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
        this.printStepProfilingReport = () => {
            fp_1.forOwn(this.transformEventData.stepStreamCounts, function (o, stepName) {
                Logger_1.default.info(stepName, ':', o);
            });
        };
        this.transformName = transformName;
        this.transformEmitter = new TransformEmitter();
        //Setup any events listeners we care about here...
        this.transformEmitter.on('countStream', (stepKey, countType) => {
            if (!fp_1.has(this.transformEventData.stepStreamCounts, stepKey)) {
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
        let that = this;
        return new Promise(function (resolve, reject) {
            pluginNames = fp_1.isArray(pluginNames) ? pluginNames : [pluginNames];
            pluginNames.forEach(function (pluginName) {
                try {
                    if (pluginType === 'Core' || pluginType === 'Vendor') {
                        that.Plugins.Core[pluginName] = require(path_1.default.resolve(__dirname, 'plugins/' + pluginType.toLowerCase() + '/' + pluginName + '/' + pluginName));
                    }
                    else {
                        reject('Invalid plugin type given, must be Core or Vendor!');
                    }
                }
                catch (err) {
                    //logger.error('Nextract mixin: ', err);
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
        return through2_spy_1.default.obj(() => {
            this.transformEmitter.emit('countStream', stepKey, direction);
        });
    }
}
exports.default = Nextract;
;

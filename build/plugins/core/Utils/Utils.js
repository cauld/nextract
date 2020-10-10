"use strict";
/**
 * Utility methods
 *
 * @class Nextract.Plugins.Core.Utils
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("lodash/fp");
const pluginBase_1 = __importDefault(require("../../pluginBase"));
//Instantiate the plugin
let utilsPlugin = new pluginBase_1.default('Utils', 'Core');
module.exports = {
    /**
     * Utility which runs all passed Promises and returns only once all have been fufilled
     *
     * @method runAll
     * @for Nextract.Plugins.Core.Utils
     *
     * @example
     *     ETL.Plugins.Core.Utils.runAll([p1, p2]);
     *
     * @param {Array} promisesToRunAn array of Promises
     *
     * @return {Promise} Promise resolved with an array of Promise resolutions
     */
    runAll: function (promisesToRun) {
        return Promise.all(promisesToRun);
    },
    /**
     * Operates on a stream returning only the requested properties from element
     *
     * @method pluckProperties
     * @for Nextract.Plugins.Core.Utils
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Utils.pluckProperties(['foo', 'bar', 'baz']))
     *
     * @param {Array} propertiesToTake Array of property names to keep
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    pluckProperties: function (propertiesToTake) {
        let streamFunction = function (element) {
            let elementKeys = fp_1.keys(element);
            elementKeys.forEach(function (key) {
                if (fp_1.includes(propertiesToTake, key) === false) {
                    delete element[key];
                }
            });
            return element;
        };
        return utilsPlugin.buildStreamTransform(streamFunction, null, 'map');
    },
    /**
     * Operates on a stream returning only the requested properties from element
     *
     * @method pluckProperties
     * @for Nextract.Plugins.Core.Utils
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Utils.pluckProperties(['foo', 'bar', 'baz']))
     *
     * @param {Array} propertiesToTake Array of property names to keep
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    streamConvertBufferToString: function () {
        let streamFunction = function (element) {
            return element.toString();
        };
        return utilsPlugin.buildStreamTransform(streamFunction, null, 'map');
    },
    /**
     * Logs the current element flowing through the stream. Useful in debugging.
     *
     * @method streamConsoleLogStreamItem
     * @for Nextract.Plugins.Core.Utils
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Utils.streamConsoleLogStreamItem("DEBUGGING: "))
     *
     * @param {String} openingLogMsg A string preceeding the element output (defaults to 'Stream debug: ').
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    streamConsoleLogStreamItem: function (openingLogMsg = 'Stream debug: ') {
        let streamFunction = function (element) {
            utilsPlugin.ETL.logger.debug(openingLogMsg, element);
            return element;
        };
        return utilsPlugin.buildStreamTransform(streamFunction, null, 'map');
    }
};

'use strict';

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
var utilsPlugin = new _pluginBase2.default('Utils', 'Core'); /**
                                                              * Utility methods
                                                              *
                                                              * @class Nextract.Plugins.Core.Utils
                                                              */

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
  runAll: function runAll(promisesToRun) {
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
  pluckProperties: function pluckProperties(propertiesToTake) {
    var streamFunction = function streamFunction(element) {
      var elementKeys = (0, _keys3.default)(element);

      elementKeys.forEach(function (key) {
        if ((0, _includes3.default)(propertiesToTake, key) === false) {
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
  streamConvertBufferToString: function streamConvertBufferToString() {
    var streamFunction = function streamFunction(element) {
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
  streamConsoleLogStreamItem: function streamConsoleLogStreamItem() {
    var openingLogMsg = arguments.length <= 0 || arguments[0] === undefined ? 'Stream debug: ' : arguments[0];

    var streamFunction = function streamFunction(element) {
      utilsPlugin.ETL.logger.debug(openingLogMsg, element);
      return element;
    };

    return utilsPlugin.buildStreamTransform(streamFunction, null, 'map');
  }

};

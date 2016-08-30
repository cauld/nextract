/**
 * Utility methods
 *
 * @class Nextract.Plugins.Core.Utils
 */

import _ from 'lodash';
import { keys, includes } from 'lodash/fp';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
var utilsPlugin = new pluginBase('Utils', 'Core');

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
  runAll: function(promisesToRun) {
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
  pluckProperties: function(propertiesToTake) {
    var streamFunction = function(element, index) {
      var elementKeys = _.keys(element);

      elementKeys.forEach(function(key) {
        if (_.includes(propertiesToTake, key) === false) {
          delete element[key];
        }
      });

      return element;
    };

    return utilsPlugin.buildStreamTransform(streamFunction, 'map');
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
  streamConvertBufferToString: function() {
    var streamFunction = function(element, index) {
      return element.toString();
    };

    return utilsPlugin.buildStreamTransform(streamFunction, 'map');
  }

};

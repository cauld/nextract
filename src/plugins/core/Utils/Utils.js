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
   * Modifes each item of a collection returning only the requested properties from each.
   * Deep picking is not yet supported.
   *
   * @method pluckProperties
   * @for Nextract.Plugins.Core.Utils
   *
   * @example
   *     ETL.Plugins.Core.Utils.pluckProperties(collection, ['foo', 'bar', 'baz']);
   *
   * @param {Object} collection The collection to iterate over
   * @param {Array} propertiesToTake Array of property names to keep
   *
   * @return {Promise} Promise resolved with updated collection
   */
  pluckProperties: function(collection, propertiesToTake) {
    return new Promise(function (resolve, reject) {
      if (collection.length < utilsPlugin.ETL.config.collections.sizeToBackground) {
        //Run inline
        collection.map(function(element) {
          var elementKeys = _.keys(element);

          elementKeys.forEach(function(key) {
            if (_.includes(propertiesToTake, key) === false) {
              delete element[key];
            }
          });
        });

        resolve(collection);
      } else {
        var workerMsg = {
          cmd: 'pluckProperties',
          args: [collection, propertiesToTake]
        };

        utilsPlugin.runInWorker(workerMsg)
          .then(function(collection) {
            resolve(collection);
          });
      }
    });
  }

};

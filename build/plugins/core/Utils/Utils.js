'use strict';

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Utility methods
 *
 * @class Nextract.Plugins.Core.Utils
 */

module.exports = {

  /**
   * Utility which runs all passed Promises and returns only once all have been fufilled
   *
   * @method runAll
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
   * Modifes each item of a collection returning only the requested properties from each.
   * Deep picking is not yet supported.
   *
   * @method pluckProperties
   * @example
   *     ETL.Plugins.Core.Utils.pluckProperties(collection, ['foo', 'bar', 'baz']);
   *
   * @param {Object} collection The collection to iterate over
   * @param {Array} propertiesToTake Array of property names to keep
   *
   * @return {Promise} Promise resolved with updated collection
   */
  pluckProperties: function pluckProperties(collection, propertiesToTake) {
    return new Promise(function (resolve, reject) {
      collection.map(function (element) {
        var elementKeys = (0, _keys3.default)(element);

        elementKeys.forEach(function (key) {
          if ((0, _includes3.default)(propertiesToTake, key) === false) {
            delete element[key];
          }
        });
      });

      resolve(collection);
    });
  }

};

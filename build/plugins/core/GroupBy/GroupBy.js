'use strict';

var _sumBy2 = require('lodash/sumBy');

var _sumBy3 = _interopRequireDefault(_sumBy2);

var _meanBy2 = require('lodash/meanBy');

var _meanBy3 = _interopRequireDefault(_meanBy2);

var _minBy2 = require('lodash/minBy');

var _minBy3 = _interopRequireDefault(_minBy2);

var _maxBy2 = require('lodash/maxBy');

var _maxBy3 = _interopRequireDefault(_maxBy2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import pluginUtils from '../../pluginUtils';

/**
 * Mixes in methods used to perform grouping operations on data
 *
 * @class Nextract.Plugins.Core.GroupBy
 */

module.exports = {

  /**
   * Computes the maximum value of array. It accepts iteratee which is invoked for each element in
   * array to generate the criterion by which the value is ranked. The iteratee is invoked with
   * one argument: (value).
   *
   * For usage reference - https://lodash.com/docs#maxBy
   *
   * @method maxBy
   * @example
   *     ETL.Plugins.Core.GroupBy.maxBy(objects, 'n');
   *
   * @return {Promise} Promise resolved with the maximum value
   */
  maxBy: function maxBy(array, iteratee) {
    return Promise.resolve((0, _maxBy3.default)(array, iteratee));
  },

  /**
   * Computes the minimum value of array. It accepts iteratee which is invoked for each element in
   * array to generate the criterion by which the value is ranked. The iteratee is invoked with
   * one argument: (value).
   *
   * For usage reference - https://lodash.com/docs#minBy
   *
   * @method minBy
   * @example
   *     ETL.Plugins.Core.GroupBy.minBy(objects, 'n');
   *
   * @return {Promise} Promise resolved with the maximum value
   */
  minBy: function minBy(array, iteratee) {
    return Promise.resolve((0, _minBy3.default)(array, iteratee));
  },

  /**
   * Computes the mean of the values in array. It accepts iteratee which is invoked for each element in
   * array to generate the criterion by which the value is ranked. The iteratee is invoked with
   * one argument: (value).
   *
   * For usage reference - https://lodash.com/docs#maxBy
   *
   * @method meanBy
   * @example
   *     ETL.Plugins.Core.GroupBy.meanBy(objects, 'n');
   *
   * @return {Promise} Promise resolved with the maximum value
   */
  meanBy: function meanBy(array, iteratee) {
    return Promise.resolve((0, _meanBy3.default)(array, iteratee));
  },

  /**
   * Computes the sum of the values in array. It accepts iteratee which is invoked for each element
   * in array to generate the value to be summed. The iteratee is invoked with one argument: (value).
   *
   * For usage reference - https://lodash.com/docs#maxBy
   *
   * @method sumBy
   * @example
   *     ETL.Plugins.Core.GroupBy.sumBy(objects, 'n');
   *
   * @return {Promise} Promise resolved with the sum
   */
  sumBy: function sumBy(array, iteratee) {
    return Promise.resolve((0, _sumBy3.default)(array, iteratee));
  }

};

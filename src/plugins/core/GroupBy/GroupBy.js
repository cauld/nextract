/**
 * Mixes in methods used to perform grouping operations on data
 *
 * @class Nextract.Plugins.Core.GroupBy
 */

import _ from 'lodash';
import { maxBy, minBy, meanBy, sumBy } from 'lodash/fp';
//import pluginUtils from '../../pluginUtils';

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
  maxBy: function(array, iteratee) {
    return Promise.resolve(_.maxBy(array, iteratee));
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
  minBy: function(array, iteratee) {
    return Promise.resolve(_.minBy(array, iteratee));
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
  meanBy: function(array, iteratee) {
    return Promise.resolve(_.meanBy(array, iteratee));
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
  sumBy: function(array, iteratee) {
    return Promise.resolve(_.sumBy(array, iteratee));
  }

};

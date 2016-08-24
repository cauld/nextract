/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

import _ from 'lodash';
import { orderBy, sortBy, isArray, isFunction } from 'lodash/fp';
import pluginUtils from '../../pluginUtils';

module.exports = {

  /**
   * This method is like _.sortBy except that it allows specifying the sort orders of the iteratees to sort by.
   * If orders is unspecified, all values are sorted in ascending order. Otherwise, specify an order of "desc"
   * for descending or "asc" for ascending sort order of corresponding values.
   *
   * For usage reference - https://lodash.com/docs#orderBy
   *
   * @method orderBy
   * @example
   *     ETL.Plugins.Core.Sort.orderBy(users, ['user', 'age'], ['asc', 'desc']);
   *
   * @return {Promise} Promise resolved with the new sorted array
   */
   orderBy: function(collection, iteratees = [], orders = []) {
/*
    if (collection.length < 1000) {
      return Promise.resolve(_.orderBy(collection, iteratees, orders));
    } else {
      var workerMsg = {
        cmd: 'orderBy',
        args: [collection, iteratees, orders]
      };

      return pluginUtils.runInWorker('Core', workerName, workerMsg);
    }
*/


    var workerMsg = {
      cmd: 'orderBy',
      args: [collection, iteratees, orders]
    };

    return pluginUtils.runInWorker('Core', 'Sort', workerMsg);

  },

  /**
   * Creates an array of elements, sorted in ascending order by the results of running each element in a collection thru each iteratee.
   * This method performs a stable sort, that is, it preserves the original sort order of equal elements.
   * The iteratees are invoked with one argument: (value).
   *
   * For usage reference - https://lodash.com/docs#sortBy
   *
   * @method sortBy
   * @example
   *     ETL.Plugins.Core.Sort.sortBy(users, ['user', 'age']);
   *
   * @return {Promise} Promise resolved with the new sorted array
   */
   sortBy: function(collection, iteratees = []) {
    return Promise.resolve(_.sortBy(collection, iteratees));
  },

  /**
   * Sorts the elements of an array in place via a custom compare function
   *
   * For usage reference - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
   *
   * @method customCompare
   * @example
   *     ETL.Plugins.Core.Sort.customCompare(users, compareFunction);
   *
   * @param {Array|Object} collection The collection to iterate over
   * @param {Function} Specifies a function that defines the sort order
   * @return {Promise} Promise resolved with the new sorted array
   */
  customCompare: function(collection, compareFunction) {
    return new Promise(function (resolve, reject) {
      if (_.isFunction(compareFunction) === false) {
        reject("A custom sorting function must be passed!");
      } else if (_.isArray(collection) === false) {
        reject("The custom method expects an array of data to sort!");
      } else {
        var ordered = collection.sort(compareFunction);
        resolve(ordered);
      }
    });
  }

};

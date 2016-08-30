/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

//import _ from 'lodash';
//import { orderBy, sortBy, isArray, isFunction } from 'lodash/fp';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
//var sortPlugin = new pluginBase('Sort', 'Core');

//TODO: Reimplement sort as part of the stream flow
//See for reference https://github.com/jed/sort-stream2, but we can't assume
//memory will be ample enough for the entry dataset to be buffer.  We'll most likely
//need tmp files.

/* Plugin external interface */
module.exports = {

  /**
   * Creates an array of elements, sorted in ascending order by the results of running each element in a collection thru each iteratee.
   * This method performs a stable sort, that is, it preserves the original sort order of equal elements.
   * The iteratees are invoked with one argument: (value).
   *
   * For usage reference - https://lodash.com/docs#sortBy
   *
   * @method sortBy
   * @for Nextract.Plugins.Core.Sort
   *
   * @example
   *     ETL.Plugins.Core.Sort.sortBy(users, ['user', 'age']);
   *
   * @return {Promise} Promise resolved with the new sorted array
   */
  sortBy: function() {

  },

  /**
   * This method is like sortBy except that it allows specifying the sort orders of the iteratees to sort by.
   * If orders is unspecified, all values are sorted in ascending order. Otherwise, specify an order of "desc"
   * for descending or "asc" for ascending sort order of corresponding values.
   *
   * For usage reference - https://lodash.com/docs#orderBy
   *
   * @method orderBy
   * @for Nextract.Plugins.Core.Sort
   *
   * @example
   *     ETL.Plugins.Core.Sort.orderBy(users, ['user', 'age'], ['asc', 'desc']);
   *
   * @return {Promise} Promise resolved with the new sorted array
   */
  orderBy: function() {

  },

  /**
   * Sorts the elements of an array in place via a custom compare function
   *
   * For usage reference - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
   *
   * @method customCompare
   * @for Nextract.Plugins.Core.Sort
   *
   * @example
   *     ETL.Plugins.Core.Sort.customCompare(users, compareFunction);
   *
   * @param {Array|Object} collection The collection to iterate over
   * @param {Function} Specifies a function that defines the sort order
   * @return {Promise} Promise resolved with the new sorted array
   */
  customCompare: function() {

  }

};

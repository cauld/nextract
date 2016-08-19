'use strict';

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _orderBy2 = require('lodash/orderBy');

var _orderBy3 = _interopRequireDefault(_orderBy2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

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
  orderBy: function orderBy(collection) {
    var iteratees = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
    var orders = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    return Promise.resolve((0, _orderBy3.default)(collection, iteratees, orders));
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
  sortBy: function sortBy(collection) {
    var iteratees = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    return Promise.resolve((0, _sortBy3.default)(collection, iteratees));
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
  customCompare: function customCompare(collection, compareFunction) {
    return new Promise(function (resolve, reject) {
      if ((0, _isFunction3.default)(compareFunction) === false) {
        reject("A custom sorting function must be passed!");
      } else if ((0, _isArray3.default)(collection) === false) {
        reject("The custom method expects an array of data to sort!");
      } else {
        var ordered = collection.sort(compareFunction);
        resolve(ordered);
      }
    });
  }

};

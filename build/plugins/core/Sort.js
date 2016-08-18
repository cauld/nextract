"use strict";

/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

var _ = require('lodash');

module.exports = {

  /*
    Arguments:
    collection (Array|Object): The collection to iterate over.
    [iteratees=[_.identity]] (Array[]|Function[]|Object[]|string[]): The iteratees to sort by.
    [orders] (string[]): The sort orders of iteratees.
    (e.g.) by(users, ['user', 'age'], ['asc', 'desc']);
  */

  /**
   * TBD...
   *
   * @method by
   * @example
   *     ETL.Plugins.Core.Utils.runAll([p1, p2]);
   *
   * @param {Array} promisesToRunAn array of Promises
   * @return {Promise} Promise resolved with an array of Promise resolutions
   */
  by: function by(dataToSort, propertiesToSortBy, propertiesSortDirection) {
    propertiesToSortBy = _.isArray(propertiesToSortBy) ? propertiesToSortBy : [propertiesToSortBy];
    propertiesSortDirection = _.isArray(propertiesSortDirection) ? propertiesSortDirection : [propertiesSortDirection];

    return new Promise(function (resolve, reject) {
      var ordered = _.orderBy(dataToSort, propertiesToSortBy, propertiesSortDirection);
      resolve(ordered);
    });
  },

  custom: function custom(dataToSort, customSortFunction) {
    return new Promise(function (resolve, reject) {
      if (_.isFunction(customSortFunction) === false) {
        reject("A custom sorting function must be passed!");
      } else if (_.isArray(dataToSort) === false) {
        reject("The custom method expects an array of data to sort!");
      } else {
        var ordered = dataToSort.sort(customSortFunction);
        resolve(ordered);
      }
    });
  }

};

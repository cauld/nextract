/**
 * Custom module used to sort data...
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
  by: function(dataToSort, propertiesToSortBy, propertiesSortDirection) {
    propertiesToSortBy = _.isArray(propertiesToSortBy) ? propertiesToSortBy : [propertiesToSortBy];
    propertiesSortDirection = _.isArray(propertiesSortDirection) ? propertiesSortDirection : [propertiesSortDirection];

    return new Promise(function (resolve, reject) {
      var ordered = _.orderBy(dataToSort, propertiesToSortBy, propertiesSortDirection);
      resolve(ordered);
    });
  },

  custom: function(dataToSort, customSortFunction) {
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

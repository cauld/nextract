/**
 * Mixes in methods used to perform grouping operations on data
 *
 * @class Nextract.Plugins.Core.GroupBy
 */

//import _ from 'lodash';
//import { maxBy, minBy, meanBy, sumBy } from 'lodash/fp';
import pluginBase from '../../pluginBase';

//Would be nice to do import as show above but babel-plugin-lodash has issues with the format _[lodashMethod]
var _ = require('lodash');

//Instantiate the plugin
var groupByPlugin = new pluginBase('GroupBy', 'Core');

function doLodashPassthrough(collection, lodashMethod, prop) {
  let taskName = lodashMethod;
  let updatedCollection;

  return new Promise(function (resolve, reject) {
    groupByPlugin
      .setupTaskEngine()
      .then(groupByPlugin.startTask(taskName))
      .then(function() {
        updatedCollection = _[lodashMethod](collection, prop);
      })
      .then(groupByPlugin.endTask(taskName))
      .then(function() {
        resolve(updatedCollection);
      });
  });
}

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
   * @param {Object} collection The collection to iterate over
   * @param {String} prop The property to use in this operation
   *
   * @return {Promise} Promise resolved with the maximum value
   */
  maxBy: function(collection, prop) {
    return doLodashPassthrough(collection, 'maxBy', prop);
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
   * @param {Object} collection The collection to iterate over
   * @param {String} prop The property to use in this operation
   *
   * @return {Promise} Promise resolved with the maximum value
   */
  minBy: function(collection, prop) {
    return doLodashPassthrough(collection, 'minBy', prop);
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
   * @param {Object} collection The collection to iterate over
   * @param {String} prop The property to use in this operation
   *
   * @return {Promise} Promise resolved with the maximum value
   */
  meanBy: function(collection, prop) {
    return doLodashPassthrough(collection, 'meanBy', prop);
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
   * @param {Object} collection The collection to iterate over
   * @param {String} prop The property to use in this operation
   *
   * @return {Promise} Promise resolved with the sum
   */
  sumBy: function(collection, prop) {
    return doLodashPassthrough(collection, 'sumBy', prop);
  }

};

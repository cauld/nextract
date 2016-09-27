/**
 * Mixes in methods used to perform grouping operations on data
 *
 * @class Nextract.Plugins.Core.GroupBy
 */

import _ from 'lodash';
import { isUndefined, isNumber, mean, uniq, uniqBy } from 'lodash/fp';
import pluginBase from '../../pluginBase';

//TODO: A lot of code in this plugin is similar, could be abstracted

//Instantiate the plugin
let groupByPlugin = new pluginBase('GroupBy', 'Core');

function checkInput(element, propertyToProcess) {
  if (_.isUndefined(element[propertyToProcess]) || !_.isNumber(element[propertyToProcess])) {
    throw new Error("GroupBy error, non-numeric value in element:", element);
  }
}

module.exports = {

 /**
  * Finds the max value of a single properties for all elements in a stream
  *
  * @method maxBy
  * @for Nextract.Plugins.Core.GroupBy
  *
  * @example
  *     someTransform.Plugins.Core.GroupBy.maxBy('salary');
  *
  * @param {String} propertyToCompare The property to get max of
  *
  * @return {Stream} The resulting stream is a single value with the max value
  */
  maxBy: function(propertyToProcess) {
    function checkAgainstMax(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      if (_.isUndefined(this.currentMax) || (element[propertyToProcess] > this.currentMax)) {
        this.currentMax = element[propertyToProcess];
      }

      return callback();
    }

    function flushGroupBy(callback) {
      this.push(this.currentMax);
      return callback();
    }

    return groupByPlugin.buildStreamTransform(checkAgainstMax, flushGroupBy, 'standard');
  },

 /**
  * Finds the min value of a single properties for all elements in a stream
  *
  * @method minBy
  * @for Nextract.Plugins.Core.GroupBy
  *
  * @example
  *     someTransform.Plugins.Core.GroupBy.minBy('salary');
  *
  * @param {String} propertyToCompare The property to get min of
  *
  * @return {Stream} The resulting stream is a single value with the min value
  */
  minBy: function(propertyToProcess) {
    function checkAgainstMin(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      if (_.isUndefined(this.currentMin) || (element[propertyToProcess] < this.currentMin)) {
        this.currentMin = element[propertyToProcess];
      }

      return callback();
    }

    function flushGroupBy(callback) {
      this.push(this.currentMin);
      return callback();
    }

    return groupByPlugin.buildStreamTransform(checkAgainstMin, flushGroupBy, 'standard');
  },

  /**
   * Computes the sum of a single properties for all elements in a stream
   *
   * @method sumBy
   * @for Nextract.Plugins.Core.GroupBy
   *
   * @example
   *     someTransform.Plugins.Core.GroupBy.sumBy('salary');
   *
   * @param {String} propertyToProcess The property to sum
   *
   * @return {Stream} The resulting stream is a single value
   */
  sumBy: function(propertyToProcess) {
    function combine(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      if (_.isUndefined(this.total)) {
        this.total = element[propertyToProcess];
        return callback();
      }
      this.total += element[propertyToProcess];
      return callback();
    }

    function flushGroupBy(callback) {
      this.push(this.total);
      return callback();
    }

    //Would be nice to use through2-reduce, but it assumes the stream is just a stream of numbers.
    return groupByPlugin.buildStreamTransform(combine, flushGroupBy, 'standard');
  },

  //TODO: Implement
  avgBy: function(propertyToProcess) {
    let valuesToAvg = [];

    function addToList(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      valuesToAvg[valuesToAvg.length] = element[propertyToProcess];
      return callback();
    }

    function flushGroupBy(callback) {
      let average = valuesToAvg.reduce(function (a, b) {
          return a + b;
      }) / valuesToAvg.length;

      this.push(average);
      return callback();
    }

    return groupByPlugin.buildStreamTransform(addToList, flushGroupBy, 'standard');
  },

 /**
  * Computes the mean of a single properties for all elements in a stream
  *
  * @method meanBy
  * @for Nextract.Plugins.Core.GroupBy
  *
  * @example
  *     someTransform.Plugins.Core.GroupBy.meanBy('salary');
  *
  * @param {String} propertyToProcess The property to calc mean for
  *
  * @return {Stream} The resulting stream is a single value
  */
  meanBy: function(propertyToProcess) {
    let valuesToMean = [];

    function addToList(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      valuesToMean[valuesToMean.length] = element[propertyToProcess];
      return callback();
    }

    function flushGroupBy(callback) {
      let calculatedMean = _.mean(valuesToMean);

      this.push(calculatedMean);
      return callback();
    }

    return groupByPlugin.buildStreamTransform(addToList, flushGroupBy, 'standard');
  },

 /**
  * Find the unique values of a single properties for all elements in a stream
  *
  * @method uniqBy
  * @for Nextract.Plugins.Core.GroupBy
  *
  * @example
  *     someTransform.Plugins.Core.GroupBy.uniqBy('salary');
  *
  * @param {String} propertyToProcess The property get uniques for
  * @param {Boolean} returnElement By default just the unique value itself is returned.
  * If this is set to true then each element with a unique value is returned instead.
  *
  * @return {Stream} The output is a new stream of just the unique values or elements.
  */
  uniqBy: function(propertyToProcess, returnElement = false) {
    let valuesToUnique = [];

    function addToList(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      if (returnElement === true) {
        valuesToUnique[valuesToUnique.length] = element;
      } else {
        valuesToUnique[valuesToUnique.length] = element[propertyToProcess];
      }

      return callback();
    }

    function flushGroupBy(callback) {
      let uniques;

      if (returnElement === true) {
        uniques = _.uniqBy(valuesToUnique, propertyToProcess);
      } else {
        uniques = _.uniq(valuesToUnique);
      }

      uniques.map(q => this.push(q));
      return callback();
    }

    return groupByPlugin.buildStreamTransform(addToList, flushGroupBy, 'standard');
  }

};

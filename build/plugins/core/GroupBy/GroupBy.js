'use strict';

var _uniq2 = require('lodash/uniq');

var _uniq3 = _interopRequireDefault(_uniq2);

var _uniqBy2 = require('lodash/uniqBy');

var _uniqBy3 = _interopRequireDefault(_uniqBy2);

var _mean2 = require('lodash/mean');

var _mean3 = _interopRequireDefault(_mean2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//TODO: A lot of code in this plugin is similar, could be abstracted

//Instantiate the plugin
var groupByPlugin = new _pluginBase2.default('GroupBy', 'Core'); /**
                                                                  * Mixes in methods used to perform grouping operations on data
                                                                  *
                                                                  * @class Nextract.Plugins.Core.GroupBy
                                                                  */

function checkInput(element, propertyToProcess) {
  if ((0, _isUndefined3.default)(element[propertyToProcess]) || !(0, _isNumber3.default)(element[propertyToProcess])) {
    throw new Error('GroupBy error, non-numeric value in element:', element);
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
  maxBy: function maxBy(propertyToProcess) {
    function checkAgainstMax(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      if ((0, _isUndefined3.default)(this.currentMax) || element[propertyToProcess] > this.currentMax) {
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
  minBy: function minBy(propertyToProcess) {
    function checkAgainstMin(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      if ((0, _isUndefined3.default)(this.currentMin) || element[propertyToProcess] < this.currentMin) {
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
  sumBy: function sumBy(propertyToProcess) {
    function combine(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      if ((0, _isUndefined3.default)(this.total)) {
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
  avgBy: function avgBy(propertyToProcess) {
    var valuesToAvg = [];

    function addToList(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      valuesToAvg[valuesToAvg.length] = element[propertyToProcess];
      return callback();
    }

    function flushGroupBy(callback) {
      var average = valuesToAvg.reduce(function (a, b) {
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
  meanBy: function meanBy(propertyToProcess) {
    var valuesToMean = [];

    function addToList(element, encoding, callback) {
      checkInput(element, propertyToProcess);

      valuesToMean[valuesToMean.length] = element[propertyToProcess];
      return callback();
    }

    function flushGroupBy(callback) {
      var calculatedMean = (0, _mean3.default)(valuesToMean);

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
  uniqBy: function uniqBy(propertyToProcess) {
    var returnElement = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var valuesToUnique = [];

    function addToList(element, encoding, callback) {
      if (returnElement === true) {
        valuesToUnique[valuesToUnique.length] = element;
      } else {
        valuesToUnique[valuesToUnique.length] = element[propertyToProcess];
      }

      return callback();
    }

    function flushGroupBy(callback) {
      var _this = this;

      var uniques = void 0;

      if (returnElement === true) {
        uniques = (0, _uniqBy3.default)(valuesToUnique, propertyToProcess);
      } else {
        uniques = (0, _uniq3.default)(valuesToUnique);
      }

      uniques.map(function (q) {
        return _this.push(q);
      });
      return callback();
    }

    return groupByPlugin.buildStreamTransform(addToList, flushGroupBy, 'standard');
  }

};

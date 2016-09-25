'use strict';

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
var groupByPlugin = new _pluginBase2.default('GroupBy', 'Core'); /**
                                                                  * Mixes in methods used to perform grouping operations on data
                                                                  *
                                                                  * @class Nextract.Plugins.Core.GroupBy
                                                                  */

module.exports = {

  //TODO: Implement
  maxBy: function maxBy() {},

  //TODO: Implement
  minBy: function minBy() {},

  //TODO: Implement
  meanBy: function meanBy() {},

  /**
   * Computes the sum of a single properties for all elements in a stream
   *
   * @method sumBy
   * @for Nextract.Plugins.Core.GroupBy
   *
   * @example
   *     someTransform.Plugins.Core.GroupBy.sumBy('salary');
   *
   * @param {String} prop The property to sum
   *
   * @return {Stream} The resulting stream is a single value
   */
  sumBy: function sumBy(propertyToSum) {
    function combine(element, encoding, callback) {
      if (!(0, _isNumber3.default)(element[propertyToSum])) {
        throw new Error("sumBy failed! Non numeric value in element:", element);
      }

      if ((0, _isUndefined3.default)(this.total)) {
        this.total = element[propertyToSum];
        return callback();
      }
      this.total += element[propertyToSum];
      return callback();
    }

    function flush(callback) {
      this.push(this.total);
      return callback();
    }

    //Would be nice to use through2-reduce, but it assumes the stream is just a stream of numbers.
    return groupByPlugin.buildStreamTransform(combine, flush, 'standard');
  },

  //TODO: Implement, ref - https://www.npmjs.com/package/unique-stream
  uniqBy: function uniqBy() {}

};

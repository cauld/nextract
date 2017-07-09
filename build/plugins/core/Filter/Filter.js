'use strict';

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
var filterPlugin = new _pluginBase2.default('Filter', 'Core'); /**
                                                                * Mixes in methods used to filter sets of data
                                                                *
                                                                * @class Nextract.Plugins.Core.Filter
                                                                */

module.exports = {

  /**
   * Filters a stream, passing along all elements that equal the given testValue
   *
   * @method equals
   * @for Nextract.Plugins.Core.Filter
   *
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.equals('age', 30))
   *
   * @param {String} propertyToTest The object property name being tested against
   * @param {String|Number} valueToTest The value being against
   * @param {Boolean} useStrictEquality (optional, defaults to false) Uses the === comparison operator.
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  equals: function equals(propertyToTest, valueToTest) {
    var useStrictEquality = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var streamFunction = function streamFunction(element, index) {
      if (!(0, _isUndefined3.default)(element) && (0, _has3.default)(element, propertyToTest)) {
        if (useStrictEquality === true) {
          return element[propertyToTest] === valueToTest;
        } else {
          return element[propertyToTest] == valueToTest;
        }
      } else {
        return false;
      }
    };

    return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
  },

  /**
   * Filters a stream, passing along all elements that do not equal the given testValue
   *
   * @method notEquals
   * @for Nextract.Plugins.Core.Filter
   *
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.notEquals('age', 30))
   *
   * @param {String} propertyToTest The object property name being tested against
   * @param {String|Number} valueToTest The value being against
   * @param {Boolean} useStrictEquality (optional, defaults to false) Uses the !== comparison operator.
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  notEquals: function notEquals(propertyToTest, valueToTest) {
    var useStrictEquality = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var streamFunction = function streamFunction(element, index) {
      if (!(0, _isUndefined3.default)(element) && (0, _has3.default)(element, propertyToTest)) {
        if (useStrictEquality === true) {
          return element[propertyToTest] !== valueToTest;
        } else {
          return element[propertyToTest] != valueToTest;
        }
      } else {
        return false;
      }
    };

    return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
  },

  /**
   * Filters a stream, passing along all elements that are great than the given testValue
   *
   * @method greaterThan
   * @for Nextract.Plugins.Core.Filter
   *
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.greaterThan('age', 30))
   *
   * @param {String} propertyToTest The object property name being tested against
   * @param {Number} valueToTest The value being against
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  greaterThan: function greaterThan(propertyToTest, valueToTest) {
    var streamFunction = function streamFunction(element) {
      if (!(0, _isUndefined3.default)(element) && (0, _has3.default)(element, propertyToTest)) {
        return element[propertyToTest] > valueToTest;
      } else {
        return false;
      }
    };

    return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
  },

  /**
   * Filters a stream, passing along all elements that are great than or equal to the given testValue
   *
   * @method greaterThanOrEqualTo
   * @for Nextract.Plugins.Core.Filter
   *
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.greaterThanOrEqualTo('age', 30))
   *
   * @param {String} propertyToTest The object property name being tested against
   * @param {Number} valueToTest The value being against
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  greaterThanOrEqualTo: function greaterThanOrEqualTo(propertyToTest, valueToTest) {
    var streamFunction = function streamFunction(element, index) {
      if (!(0, _isUndefined3.default)(element) && (0, _has3.default)(element, propertyToTest)) {
        return element[propertyToTest] >= valueToTest;
      } else {
        return false;
      }
    };

    return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
  },

  /**
   * Filters a stream, passing along all elements that are less than the given testValue
   *
   * @method lessThan
   * @for Nextract.Plugins.Core.Filter
   *
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.lessThan('age', 30))
   *
   * @param {String} propertyToTest The object property name being tested against
   * @param {Number} valueToTest The value being against
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  lessThan: function lessThan(propertyToTest, valueToTest) {
    var streamFunction = function streamFunction(element, index) {
      if (!(0, _isUndefined3.default)(element) && (0, _has3.default)(element, propertyToTest)) {
        return element[propertyToTest] < valueToTest;
      } else {
        return false;
      }
    };

    return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
  },

  /**
   * Filters a stream, passing along all elements that are less or equal to than the given testValue
   *
   * @method lessThanOrEqualTo
   * @for Nextract.Plugins.Core.Filter
   *
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.lessThanOrEqualTo('age', 30))
   *
   * @param {String} propertyToTest The object property name being tested against
   * @param {Number} valueToTest The value being against
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  lessThanOrEqualTo: function lessThanOrEqualTo(propertyToTest, valueToTest) {
    var streamFunction = function streamFunction(element, index) {
      if (!(0, _isUndefined3.default)(element) && (0, _has3.default)(element, propertyToTest)) {
        return element[propertyToTest] <= valueToTest;
      } else {
        return false;
      }
    };

    return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
  }

};

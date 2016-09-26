'use strict';

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixes in a series of common mathematical calculations
 *
 * @class Nextract.Plugins.Core.Calculator
 */

//Would be nice to do import as show above but babel-plugin-lodash has issues with the format _[lodashMethod]
var _ = require('lodash');
//import _ from 'lodash';
//import { add, subtract, ceil, divide, floor, multiply, round, isUndefined, isInteger } from 'lodash/fp';

//Instantiate the plugin
var calculatorPlugin = new _pluginBase2.default('Calculator', 'Core');

//Many of the common calc operations can flow through lodash so this is a shared wrapper
function doLodashPassthrough(lodashMethod, firstPropOrVal, secondPropOrVal) {
  var propertyToUpdateOrAdd = arguments.length <= 3 || arguments[3] === undefined ? '' : arguments[3];

  var streamFunction = function streamFunction(element, index) {
    if (_.isUndefined(element)) return;

    var v1 = _.isString(firstPropOrVal) && _.has(element, firstPropOrVal) ? element[firstPropOrVal] : Number(firstPropOrVal);
    var v2 = _.isString(secondPropOrVal) && _.has(element, secondPropOrVal) ? element[secondPropOrVal] : Number(secondPropOrVal);

    if (_.isUndefined(v1) || _.isUndefined(v2)) {
      throw new Error('Invalid calculator ' + lodashMethod + ' request, please check your input params!');
    } else {
      //Set or update with new value
      element[propertyToUpdateOrAdd] = _[lodashMethod](v1, v2);
      return element;
    }
  };

  return calculatorPlugin.buildStreamTransform(streamFunction, null, 'map');
}

module.exports = {

  /**
   * Operates on a stream adding two numbers and/or object properties
   *
   * @method add
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.add('salary', 1000, 'new_salary'))
   *
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  add: function add(firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough('add', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Operates on a stream subtracting two numbers and/or object properties
   *
   * @method subtract
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.subtract('salary', 1000, 'new_salary'))
   *
   * @param {Object} collection The collection to iterate over
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  subtract: function subtract(firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough('subtract', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Operates on a stream multiplying two numbers and/or object properties
   *
   * @method multiply
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.multiply('salary', 1000, 'new_salary'))
   *
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  multiply: function multiply(firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough('multiply', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Operates on a stream dividing two numbers and/or object properties
   *
   * @method divide
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.divide('salary', 1000, 'new_salary'))
   *
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  divide: function divide(firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough('divide', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Operates on a stream concatenating strings and/or object properties
   *
   * @method concat
   * @example
   *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.concat(['Mr/Mrs:', 'first_name', 'last_name'], ' ', 'full_name'))
   *
   * @param {Array} propsOrValsToConcat An array of strings and/or object properties to concat
   * @param {String} delimiter The delimiter to use in between each propsOrValsToConcat
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  concat: function concat(propsOrValsToConcat) {
    var delimiter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
    var propertyToUpdateOrAdd = arguments[2];

    var streamFunction = function streamFunction(element, index) {
      //First assume each string is a key in the object, if not treat as a normal string
      var valuesToConcat = [];
      propsOrValsToConcat.forEach(function (p) {
        var v = _.has(element, p) === true ? element[p].toString() : p.toString();
        valuesToConcat[valuesToConcat.length] = v;
      });

      //Set or update with new value
      element[propertyToUpdateOrAdd] = valuesToConcat.join(delimiter);
      return element;
    };

    return calculatorPlugin.buildStreamTransform(streamFunction, null, 'map');
  }

  //TODO: Implement...
  /*
    round
    floor
    ceil
    sqrt
    split field
    uppercase
    lowercase
    replace
    null/empty default
  */

};

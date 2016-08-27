'use strict';

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Would be nice to do import as show above but babel-plugin-lodash has issues with the format _[lodashMethod]
var _ = require('lodash');

//Instantiate the plugin
/**
 * Mixes in a series of common mathematical calculations
 *
 * @class Nextract.Plugins.Core.Calculator
 */

//import _ from 'lodash';
//import { add, subtract, ceil, divide, floor, multiply, round, isUndefined, isInteger } from 'lodash/fp';

var calculatorPlugin = new _pluginBase2.default('Calculator', 'Core');

function doLodashPassthrough(collection, lodashMethod, firstPropOrVal, secondPropOrVal) {
  var propertyToUpdateOrAdd = arguments.length <= 4 || arguments[4] === undefined ? '' : arguments[4];

  var taskName = lodashMethod;
  var updatedCollection = void 0;

  return new Promise(function (resolve, reject) {
    calculatorPlugin.setupTaskEngine().then(calculatorPlugin.startTask(taskName)).then(function () {
      collection.forEach(function (element) {
        //Users can pass a property name or a number to be added
        var v1 = _.isString(firstPropOrVal) && _.has(element, firstPropOrVal) ? element[firstPropOrVal] : Number(firstPropOrVal);
        var v2 = _.isString(secondPropOrVal) && _.has(element, secondPropOrVal) ? element[secondPropOrVal] : Number(secondPropOrVal);

        if (_.isUndefined(v1) || _.isUndefined(v2)) {
          reject('Invalid calculator ' + lodashMethod + ' request, please check your input params!');
        } else {
          //Set or update with new value
          element[propertyToUpdateOrAdd] = _[lodashMethod](v1, v2);
        }
      });

      return collection;
    }).then(function (collection) {
      updatedCollection = collection;
    }).then(calculatorPlugin.endTask(taskName)).then(function () {
      resolve(updatedCollection);
    });
  });
}

module.exports = {

  /**
   * Adds two numbers and/or object properties
   *
   * @method add
   * @example
   *     ETL.Plugins.Core.Calculator.add(collection, 'salary', 1000, 'new_salary');
    * @param {Object} collection The collection to iterate over
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {Promise} Promise resolved with the updated collection
   */
  add: function add(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough(collection, 'add', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Subtracts two numbers and/or object properties
   *
   * @method subtract
   * @example
   *     ETL.Plugins.Core.Calculator.subtract(collection, 'salary', 1000, 'new_salary');
    * @param {Object} collection The collection to iterate over
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {Promise} Promise resolved with the updated collection
   */
  subtract: function subtract(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough(collection, 'subtract', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Divides two numbers and/or object properties
   *
   * @method divide
   * @example
   *     ETL.Plugins.Core.Calculator.divide(collection, 'salary', 10, 'new_salary');
    * @param {Object} collection The collection to iterate over
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {Promise} Promise resolved with the updated collection
   */
  divide: function divide(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough(collection, 'divide', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Multiplies two numbers and/or object properties
   *
   * @method multiply
   * @example
   *     ETL.Plugins.Core.Calculator.multiply(collection, 'salary', 10, 'new_salary');
    * @param {Object} collection The collection to iterate over
   * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
   * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {Promise} Promise resolved with the updated collection
   */
  multiply: function multiply(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough(collection, 'multiply', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  /**
   * Concatenates strings and/or object properties
   *
   * @method concat
   * @example
   *     ETL.Plugins.Core.Calculator.concat(collection, ['Mr/Mrs:', 'first_name', 'last_name'], ' ', 'full_name');
    * @param {Object} collection The collection to iterate over
   * @param {Array} propsOrValsToConcat An array of strings and/or object properties to concat
   * @param {String} delimiter The delimiter to use in between each propsOrValsToConcat
   * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
   * of this operation
   *
   * @return {Promise} Promise resolved with the updated collection
   */
  concat: function concat(collection, propsOrValsToConcat) {
    var delimiter = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
    var propertyToUpdateOrAdd = arguments[3];

    var taskName = 'concat';
    var updatedCollection = void 0;

    return new Promise(function (resolve, reject) {
      calculatorPlugin.setupTaskEngine().then(calculatorPlugin.startTask(taskName)).then(function () {
        collection.forEach(function (element) {
          //First assume each string is a key in the object, if not treat as a normal string
          var valuesToConcat = [];
          propsOrValsToConcat.forEach(function (p) {
            var v = _.has(element, p) === true ? element[p].toString() : p.toString();
            valuesToConcat[valuesToConcat.length] = v;
          });

          //Set or update with new value
          element[propertyToUpdateOrAdd] = valuesToConcat.join(delimiter);
        });

        return collection;
      }).then(function (collection) {
        updatedCollection = collection;
      }).then(calculatorPlugin.endTask(taskName)).then(function () {
        resolve(updatedCollection);
      });
    });
  },

  //TBD...
  round: function round() {},

  //TBD...
  floor: function floor() {},

  //TBD...
  ceil: function ceil() {}

  //TODO: Implement...
  /*
    sqrt
    split field
    uppercase
    lowercase
    replace
    null/empty default
  */

};

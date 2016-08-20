/**
 * Mixes in a series of common mathematical calculations
 *
 * @class Nextract.Plugins.Core.Calculator
 */

//import _ from 'lodash';
//import { add, subtract, ceil, divide, floor, multiply, round, concat, isUndefined, isInteger } from 'lodash/fp';

//Would be nice to do import as show above but babel-plugin-lodash has issues with the format _[lodashMethod]
var _ = require("lodash");

function doLodashPassthrough(collection, lodashMethod, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
  return new Promise(function (resolve, reject) {
    console.log("lodashMethod", lodashMethod);

    collection.forEach(function(element) {
      let v1 = _.isInteger(firstPropOrVal) === true ? firstPropOrVal : element[firstPropOrVal];
      let v2 = _.isInteger(secondPropOrVal) === true ? secondPropOrVal : element[secondPropOrVal];

      if (_.isUndefined(v1) || _.isUndefined(v2)) {
        reject('Invalid calculator request, please check your input params!');
      } else {
        //Set or update with new value
        element[propertyToUpdateOrAdd] = _[lodashMethod](v1, v2);
      }
    });

    resolve(collection);
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
  add: function(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
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
  subtract: function(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
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
  divide: function(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
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
  multiply: function(collection, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
    return doLodashPassthrough(collection, 'multiply', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
  },

  //TBD...
  concat: function() {

  },

  //TBD...
  round: function() {

  },

  //TBD...
  floor: function() {

  },

  //TBD...
  ceil: function() {

  }

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

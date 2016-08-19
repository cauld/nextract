/**
 * Mixes in a series of common mathematical calculations
 *
 * @class Nextract.Plugins.Core.Calculator
 */

import _ from 'lodash';
import { add, subtract, ceil, divide, floor, mean, multiply, round, concat } from 'lodash/fp';

module.exports = {

  /**
   * Adds numbers
   *
   * @method add
   */
  add: function(collection, propertiesToAdd) {
    _.add(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method subtract
   */
  subtract: function() {
    _.subtract(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method ceil
   */
  ceil: function() {
    _.ceil(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method divide
   */
  divide: function() {
    _.divide(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method floor
   */
  floor: function() {
    _.floor(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method mean
   */
  mean: function() {
    _.mean(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method multiply
   */
  multiply: function() {
    _.multiply(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method round
   */
  round: function() {
    _.round(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method concat
   */
  concat: function() {
    _.concat(6, 4);
  },


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
   * @return {Promise} Promise resolved with the maximum value
   */

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

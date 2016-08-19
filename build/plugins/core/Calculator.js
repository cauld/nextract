'use strict';

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _round2 = require('lodash/round');

var _round3 = _interopRequireDefault(_round2);

var _multiply2 = require('lodash/multiply');

var _multiply3 = _interopRequireDefault(_multiply2);

var _mean2 = require('lodash/mean');

var _mean3 = _interopRequireDefault(_mean2);

var _floor2 = require('lodash/floor');

var _floor3 = _interopRequireDefault(_floor2);

var _divide2 = require('lodash/divide');

var _divide3 = _interopRequireDefault(_divide2);

var _ceil2 = require('lodash/ceil');

var _ceil3 = _interopRequireDefault(_ceil2);

var _subtract2 = require('lodash/subtract');

var _subtract3 = _interopRequireDefault(_subtract2);

var _add2 = require('lodash/add');

var _add3 = _interopRequireDefault(_add2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixes in a series of common mathematical calculations
 *
 * @class Nextract.Plugins.Core.Calculator
 */

module.exports = {

  /**
   * Adds numbers
   *
   * @method add
   */
  add: function add(collection, propertiesToAdd) {
    (0, _add3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method subtract
   */
  subtract: function subtract() {
    (0, _subtract3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method ceil
   */
  ceil: function ceil() {
    (0, _ceil3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method divide
   */
  divide: function divide() {
    (0, _divide3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method floor
   */
  floor: function floor() {
    (0, _floor3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method mean
   */
  mean: function mean() {
    (0, _mean3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method multiply
   */
  multiply: function multiply() {
    (0, _multiply3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method round
   */
  round: function round() {
    (0, _round3.default)(6, 4);
  },

  /**
   * Adds numbers
   *
   * @method concat
   */
  concat: function concat() {
    (0, _concat3.default)(6, 4);
  }

};

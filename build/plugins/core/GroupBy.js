'use strict';

/**
 * Custom module used to perform grouping operations on data...
 */

var _ = require('lodash');

module.exports = {

  //TODO: Implement...
  /*
   */

  maxBy: function maxBy(data, propertyToTest) {
    return new Promise(function (resolve, reject) {
      var m = _.maxBy(data, propertyToTest);
      resolve(m);
    });
  },

  sumBy: function sumBy(data, propertyToTest) {
    return new Promise(function (resolve, reject) {
      var s = _.sumBy(data, propertyToTest);
      resolve(s);
    });
  }

};

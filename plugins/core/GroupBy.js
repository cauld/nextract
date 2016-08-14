/**
 * Custom module used to perform grouping operations on data
 */

var _       = require('lodash'),
    babel   = require("babel-polyfill");

module.exports = {

  //TODO: Implement...
  /*

  */

  maxBy: function(data, propertyToTest) {
    return new Promise(function (resolve, reject) {
      var m = _.maxBy(data, propertyToTest);
      resolve(m);
    });
  },

  sumBy: function(data, propertyToTest) {
    return new Promise(function (resolve, reject) {
      var s = _.sumBy(data, propertyToTest);
      resolve(s);
    });
  }

};

/**
 * Custom module used to perform grouping operations on data...
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var _ = require('lodash');

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

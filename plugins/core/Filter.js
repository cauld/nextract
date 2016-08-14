/**
 * Custom module used to ...
 */

var _       = require('lodash'),
    babel   = require("babel-polyfill");

module.exports = {

  //TODO: Implement...
  /*
    _.find
    _.uniq
  */

  equals: function(data, propertyToTest) {
    return new Promise(function (resolve, reject) {
      var result = _.filter(data, function(v) {
        return v[propertyToTest] == testValue;
      });

      resolve(result);
    });
  },

  greaterThan: function(data, propertyToTest, testValue) {
    return new Promise(function (resolve, reject) {
      var result = _.filter(data, function(v) {
        return v[propertyToTest] > testValue;
      });

      resolve(result);
    });
  },

  lessThan: function(data, propertyToTest, testValue) {
    return new Promise(function (resolve, reject) {
      var result = _.filter(data, function(v) {
        return v[propertyToTest] < testValue;
      });

      resolve(result);
    });
  }

};

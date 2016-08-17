'use strict';

/**
 * Custom module used to filter data...
 */

var _ = require('lodash');

module.exports = {

  //TODO: Implement...
  /*
    _.find
    _.uniq
  */

  equals: function equals(data, propertyToTest, testValue) {
    return new Promise(function (resolve, reject) {
      var result = _.filter(data, function (v) {
        return v[propertyToTest] == testValue;
      });

      resolve(result);
    });
  },

  greaterThan: function greaterThan(data, propertyToTest, testValue) {
    return new Promise(function (resolve, reject) {
      var result = _.filter(data, function (v) {
        return v[propertyToTest] > testValue;
      });

      resolve(result);
    });
  },

  lessThan: function lessThan(data, propertyToTest, testValue) {
    return new Promise(function (resolve, reject) {
      var result = _.filter(data, function (v) {
        return v[propertyToTest] < testValue;
      });

      resolve(result);
    });
  }

};

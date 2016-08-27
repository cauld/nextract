'use strict';

/* eslint-disable no-unused-vars */

//import _ from 'lodash';
//import { add, subtract, multiple, divide } from 'lodash/fp';

//Would be nice to do import as show above but babel-plugin-lodash has issues with the format _[lodashMethod]
var _ = require('lodash');

self.workerMethods = {

  doLodashPassthrough: function doLodashPassthrough(collection, lodashMethod, firstPropOrVal, secondPropOrVal) {
    var propertyToUpdateOrAdd = arguments.length <= 4 || arguments[4] === undefined ? '' : arguments[4];

    collection.forEach(function (element) {
      //Users can pass a property name or a number to be added
      var v1 = _.isString(firstPropOrVal) && _.has(element, firstPropOrVal) ? element[firstPropOrVal] : Number(firstPropOrVal);
      var v2 = _.isString(secondPropOrVal) && _.has(element, secondPropOrVal) ? element[secondPropOrVal] : Number(secondPropOrVal);

      if (_.isUndefined(v1) || _.isUndefined(v2)) {
        throw 'Invalid calculator ' + lodashMethod + ' request, please check your input params!';
      } else {
        //Set or update with new value
        element[propertyToUpdateOrAdd] = _[lodashMethod](v1, v2);
      }
    });

    postMessage(collection);
  }

};

//Fired when the worker gets a postMessage calls
self.onmessage = function (workerMsg) {

  self.workerMethods.doLodashPassthrough.apply(self, workerMsg.data.args);
};

'use strict';

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _orderBy2 = require('lodash/orderBy');

var _orderBy3 = _interopRequireDefault(_orderBy2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-unused-vars */

self.workerMethods = {

  orderBy: function orderBy(collection, iteratees, orders) {
    var sortedCollection = (0, _orderBy3.default)(collection, iteratees, orders);
    postMessage(sortedCollection);
  },

  sortBy: function sortBy(collection, iteratees) {
    var sortedCollection = (0, _sortBy3.default)(collection, iteratees);
    postMessage(sortedCollection);
  },

  customCompare: function customCompare(collection, compareFunction) {
    var sortedCollection = collection.sort(compareFunction);
    postMessage(sortedCollection);
  }

};

//Fired when the worker gets a postMessage calls
self.onmessage = function (workerMsg) {
  switch (workerMsg.data.cmd) {
    case 'orderBy':
      self.workerMethods.orderBy.apply(self, workerMsg.data.args);
      break;
    case 'sortBy':
      self.workerMethods.sortBy.apply(self, workerMsg.data.args);
      break;
    case 'customCompare':
      self.workerMethods.customCompare.apply(self, workerMsg.data.args);
      break;
    default:
      throw "Invalid Sort Worker method requested!";
  }
};

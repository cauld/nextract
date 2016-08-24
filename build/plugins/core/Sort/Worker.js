'use strict';

var _orderBy2 = require('lodash/orderBy');

var _orderBy3 = _interopRequireDefault(_orderBy2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-unused-vars */

self.workerMethods = {

  orderBy: function orderBy(collection, iteratees, orders) {
    var sortedCollection = (0, _orderBy3.default)(collection, iteratees, orders);
    postMessage(sortedCollection);
  }

};

//Fired when the work gets a postMessage calls
self.onmessage = function (workerMsg) {
  switch (workerMsg.data.cmd) {
    case 'orderBy':
      self.workerMethods.orderBy.apply(self, workerMsg.data.args);
      break;
    default:

  }
};

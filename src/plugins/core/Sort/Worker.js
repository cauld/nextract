/* eslint-disable no-unused-vars */

import _ from 'lodash';
import { orderBy, sortBy } from 'lodash/fp';


self.workerMethods = {

  orderBy: function(collection, iteratees, orders) {
    var sortedCollection = _.orderBy(collection, iteratees, orders);
    postMessage(sortedCollection);
  },

  sortBy: function(collection, iteratees) {
    var sortedCollection = _.sortBy(collection, iteratees);
    postMessage(sortedCollection);
  },

  customCompare: function(collection, compareFunction) {
    var sortedCollection = collection.sort(compareFunction);
    postMessage(sortedCollection);
  }

};

//Fired when the worker gets a postMessage calls
self.onmessage = function(workerMsg) {
  switch(workerMsg.data.cmd) {
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
      throw("Invalid Sort Worker method requested!");
  }
};

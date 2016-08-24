/* eslint-disable no-unused-vars */

import _ from 'lodash';
import { orderBy, sortBy, isArray, isFunction } from 'lodash/fp';


self.workerMethods = {

  orderBy: function(collection, iteratees, orders) {
    var sortedCollection = _.orderBy(collection, iteratees, orders);
    postMessage(sortedCollection);
  }

};

//Fired when the work gets a postMessage calls
self.onmessage = function(workerMsg) {
  switch(workerMsg.data.cmd) {
    case 'orderBy':
      self.workerMethods.orderBy.apply(self, workerMsg.data.args);
      break;
    default:

  }
};

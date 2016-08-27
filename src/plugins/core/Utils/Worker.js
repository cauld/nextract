/* eslint-disable no-unused-vars */

import _ from 'lodash';
import { orderBy, sortBy } from 'lodash/fp';


self.workerMethods = {

  pluckProperties: function(collection, propertiesToTake) {
    collection.map(function(element) {
      var elementKeys = _.keys(element);

      elementKeys.forEach(function(key) {
        if (_.includes(propertiesToTake, key) === false) {
          delete element[key];
        }
      });
    });

    postMessage(collection);
  }

};

//Fired when the worker gets a postMessage calls
self.onmessage = function(workerMsg) {
  switch(workerMsg.data.cmd) {
    case 'pluckProperties':
      self.workerMethods.pluckProperties.apply(self, workerMsg.data.args);
      break;
    default:
      throw("Invalid Sort Worker method requested!");
  }
};

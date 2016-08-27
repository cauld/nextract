'use strict';

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-unused-vars */

self.workerMethods = {

  pluckProperties: function pluckProperties(collection, propertiesToTake) {
    collection.map(function (element) {
      var elementKeys = (0, _keys3.default)(element);

      elementKeys.forEach(function (key) {
        if ((0, _includes3.default)(propertiesToTake, key) === false) {
          delete element[key];
        }
      });
    });

    postMessage(collection);
  }

};

//Fired when the worker gets a postMessage calls
self.onmessage = function (workerMsg) {
  switch (workerMsg.data.cmd) {
    case 'pluckProperties':
      self.workerMethods.pluckProperties.apply(self, workerMsg.data.args);
      break;
    default:
      throw "Invalid Sort Worker method requested!";
  }
};

/**
 * Nextract
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var _    = require('lodash'),
    path = require('path');

var Nextract = function() {

  return {
    mixin: this.mixin
  }

};

//Accepts plugin type (core or vendor) and a {string|array} of plugin names to import
Nextract.prototype.mixin = function(pluginType, pluginNames) {
  var that = this;

  return new Promise(function (resolve, reject) {
    pluginNames = _.isArray(pluginNames) ? pluginNames : [pluginNames];

    pluginNames.forEach(function(pluginName) {
      try {
        if (pluginType === 'core') {
          that[pluginName] = require(path.resolve(__dirname, 'plugins/core/' + pluginName));
        } else {
           that[pluginName] = require(path.resolve(__dirname, 'plugins/vendor/' + pluginName));
        }
      } catch(err) {
        console.log(err);
        reject(err);
      }
    });

    resolve();
  });
};

module.exports = Nextract;

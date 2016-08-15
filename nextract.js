/**
 * ETL class that all programs start from
 *
 * @class Nextract
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var _      = require('lodash'),
    path   = require('path'),
    logger = require('./plugins/core/Logger');

var Nextract = function() {

  return {

    /**
     * Used to mixin the functionality of a core or 3rd party vendor ETL plugin. These
     * plugins are located in plugins/core & plugins/vendor.
     *
     * @method mixin
     * @param {String} pluginTypes Type of plugin being imported (core or vendor)
     * @param {String | Array} pluginNames Plugin(s) to import
     */
    mixin: this.mixin

  }

};

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
        logger.error('Nextract mixin: ', err);
        reject(err);
      }
    });

    resolve();
  });
};

module.exports = Nextract;

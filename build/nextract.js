'use strict';

/**
 * ETL class that all programs start from
 *
 * @class Nextract
 * @constructor
 */

var _ = require('lodash'),
    path = require('path'),
    logger = require('./plugins/core/Logger');

var Nextract = function Nextract() {

  this.Plugins = {
    /**
     * Object containing references to core plugins that have loaded in the current program
     *
     * @property Plugins.Core
     * @for Nextract
     * @type Object
     */
    Core: {},

    /**
     * Object containing references to vendor plugins that have loaded in the current program
     *
     * @property Plugins.Vendor
     * @for Nextract
     * @type Object
     */
    Vendor: {}
  };

  return {

    Plugins: this.Plugins,

    /**
     * Used to mixin the functionality of a core or 3rd party vendor ETL plugin. These
     * plugins are located in plugins/core & plugins/vendor.
     *
     * @method loadPlugin
     * @param {String} pluginTypes Type of plugin being imported (Core or Vendor)
     * @param {String | Array} pluginNames Plugin(s) to import
     */
    loadPlugin: this.mixin

  };
};

Nextract.prototype.mixin = function (pluginType, pluginNames) {
  var that = this;

  return new Promise(function (resolve, reject) {
    pluginNames = _.isArray(pluginNames) ? pluginNames : [pluginNames];

    pluginNames.forEach(function (pluginName) {
      try {
        if (pluginType === 'Core') {
          that.Plugins.Core[pluginName] = require(path.resolve(__dirname, 'plugins/core/' + pluginName));
        } else {
          that.Plugins.Vendor[pluginName] = require(path.resolve(__dirname, 'plugins/vendor/' + pluginName));
        }
      } catch (err) {
        logger.error('Nextract mixin: ', err);
        reject(err);
      }
    });

    resolve();
  });
};

module.exports = Nextract;

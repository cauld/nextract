/**
 * ETL class that all programs start from
 *
 * @class Nextract
 * @constructor
 */

import _ from 'lodash';
import { isArray } from 'lodash/fp';
import path from 'path';
import logger from './plugins/core/Logger/Logger';

var Nextract = function() {

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
     * @method loadPlugins
     * @param {String} pluginTypes Type of plugin being imported (Core or Vendor)
     * @param {String | Array} pluginNames Plugin(s) to import
     */
    loadPlugins: this.mixin

  }

};

Nextract.prototype.mixin = function(pluginType, pluginNames) {
  var that = this;

  return new Promise(function (resolve, reject) {
    pluginNames = _.isArray(pluginNames) ? pluginNames : [pluginNames];

    pluginNames.forEach(function(pluginName) {
      try {
        if (pluginType === 'Core' || pluginType === 'Vendor') {
          that.Plugins.Core[pluginName] = require(path.resolve(__dirname, 'plugins/' + pluginType.toLowerCase() + '/' + pluginName + '/' + pluginName));
        } else {
          reject('Invalid plugin type given, must be Core or Vendor!');
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

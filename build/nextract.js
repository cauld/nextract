'use strict';

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Logger = require('./plugins/core/Logger/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * ETL class that all programs start from
 *
 * @class Nextract
 * @constructor
 */

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
    pluginNames = (0, _isArray3.default)(pluginNames) ? pluginNames : [pluginNames];

    pluginNames.forEach(function (pluginName) {
      try {
        if (pluginType === 'Core' || pluginType === 'Vendor') {
          that.Plugins.Core[pluginName] = require(_path2.default.resolve(__dirname, 'plugins/' + pluginType.toLowerCase() + '/' + pluginName + '/' + pluginName));
        } else {
          reject('Invalid plugin type given, must be Core or Vendor!');
        }
      } catch (err) {
        _Logger2.default.error('Nextract mixin: ', err);
        reject(err);
      }
    });

    resolve();
  });
};

module.exports = Nextract;

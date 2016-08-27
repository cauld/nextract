'use strict';

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
/**
 * Mixes in methods used make HTTP requests
 *
 * @class Nextract.Plugins.Core.Http
 */

/*
TODO:
1) Support making requests for each item in a collection...
2) Migrate to setupTaskEngine, startTask, endTask format
*/

var httpPlugin = new _pluginBase2.default('Http', 'Core');

module.exports = {

  /**
   * Make http calls. It supports HTTPS and follows redirects by default.
   *
   * @method makeRequest
   * @for Nextract.Plugins.Core.Http
   *
   * @example
   *     var requestConfig = {
   *       url: 'http://example.com',
   *       qs: { searchString: 'foo', page: 1 },
   *       method: 'GET',
   *       headers: { 'Content-Type': 'MyContentType', 'Custom-Header': 'Custom Value' }
   *      };
   * @example
   *     ETL.Plugins.Core.Http.makeRequest(requestConfig);
   *
   * @param {Object} requestConfig A request configuration made up of key/value pairs. Wraps
   * the popular npm request module so any request config supported by this module will work.
   * See - https://www.npmjs.com/package/request#requestoptions-callback.
   *
   * @return {Promise} Promise resolved with an object like so { statusCode: 200, body: 'Hello World' }
   */
  makeRequest: function makeRequest(requestConfig) {
    return new Promise(function (resolve, reject) {
      (0, _request2.default)(requestConfig, function (err, response, body) {
        if (err) {
          httpPlugin.logger.error(err);
          reject(err);
        } else {
          var result = {
            statusCode: response.statusCode,
            body: body
          };

          resolve(result);
        }
      });
    });
  }

};

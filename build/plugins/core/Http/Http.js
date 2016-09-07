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
1) Add method to support making requests for each item in a stream...
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
   *     yourTransformInstance.Plugins.Core.Http.makeRequest(requestConfig, 'json')
   *
   * @param {Object} requestConfig A request configuration made up of key/value pairs. Wraps
   * the popular npm request module so any request config supported by this module will work.
   * See - https://www.npmjs.com/package/request#requestoptions-callback.
   * @param {String} responseFormat (optional, defaults to buffer) Allowed values are string, json, or buffer.
   *
   * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
   */
  makeRequest: function makeRequest(requestConfig) {
    var responseFormat = arguments.length <= 1 || arguments[1] === undefined ? 'buffer' : arguments[1];

    var streamFunction, readStream;

    //The request module is stream ready (https://github.com/request/request#streaming).
    //We'll add support for returning in other common formats.
    streamFunction = function streamFunction(element) {
      if (responseFormat === 'string') {
        return element.toString();
      } else if (responseFormat === 'json') {
        var jsonData;
        try {
          jsonData = JSON.parse(element.toString());
        } catch (err) {
          throw new Error('makeRequest was unable to parse as JSON!');
        }

        return jsonData;
      } else {
        return element; //return as buffer
      }
    };

    //To easily handle errors when streaming requests, listen to the error event before piping.
    readStream = (0, _request2.default)(requestConfig).on('response', function (response) {
      response = response.toString();
    }).on('error', function (err) {
      httpPlugin.logger.error(err);
    }).pipe(httpPlugin.buildStreamTransform(streamFunction, null, 'map'));

    return readStream;
  }

};

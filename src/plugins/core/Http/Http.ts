/**
 * Mixes in methods used make HTTP requests
 *
 * @class Nextract.Plugins.Core.Http
 */

/*
TODO:
1) Add method to support making requests for each item in a stream...
*/

import request from 'request';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
let httpPlugin = new pluginBase('Http', 'Core');

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
  makeRequest: function(requestConfig, responseFormat = 'buffer') {
    let streamFunction,
        readStream;

    //The request module is stream ready (https://github.com/request/request#streaming).
    //We'll add support for returning in other common formats.
    streamFunction = function(element) {
      if (responseFormat === 'string') {
        return element.toString();
      } else if (responseFormat === 'json') {
        let jsonData;
        try {
          jsonData = JSON.parse(element.toString());
        } catch(err) {
          throw new Error('makeRequest was unable to parse as JSON!');
        }

        return jsonData;
      } else {
        return element; //return as buffer
      }
    };

    //To easily handle errors when streaming requests, listen to the error event before piping.
    readStream = request(requestConfig)
                  .on('response', function(response) {
                    response = response.toString();
                  })
                  .on('error', function(err) {
                    httpPlugin.ETL.logger.error(err);
                  })
                  .pipe(httpPlugin.buildStreamTransform(streamFunction, null, 'map'));

    return readStream;
  }

};

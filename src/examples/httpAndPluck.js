/**
 * Example: CSV input and sort...
 */

var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Http', 'Utils', 'Logger'])
    .then(function() {
      //We'll use the FAA Airport Service API (http://services.faa.gov/docs/services/airport/)
      //to fetch the status of SFO. This is a simple request that requires only a URL.
      //makeRequest will except any valid request bject supported by the npm request
      //module - https://www.npmjs.com/package/request#requestoptions-callback.
      var requestConfig = {
        url: 'http://services.faa.gov/airport/status/SFO?format=application/json'
      };

      return etlJob.Plugins.Core.Http.makeRequest(requestConfig)
        .then(function(responseData) {
          if (responseData.statusCode == 200) {
            var jsonData = JSON.parse(responseData.body);
            return jsonData;
          }
        });
    })
    .then(function(airportStatus) {
      //The API response contains a goof many proprties.  Lets say we only care about a few.
      //It's always better to trim down unecessary portions of collection so that we pass around
      //the smallest set possible for performance reasons.
      var collection = [airportStatus];
      var propertiesOfInterest = ['IATA', 'name', 'delay'];
      return etlJob.Plugins.Core.Utils.pluckProperties(collection, propertiesOfInterest);
    })
    .then(function(trimmedCollection) {
      etlJob.Plugins.Core.Logger.info('Trimmed collection:', trimmedCollection);
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.error('ETL process failed:', err);
    });

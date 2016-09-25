/**
 * Example: Http request and pluck...
 */

var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var transform = new Nextract();

transform.loadPlugins('Core', ['Http', 'Utils', 'Logger'])
  .then(function() {
    //We'll use the FAA Airport Service API (http://services.faa.gov/docs/services/airport/)
    //to fetch the status of SFO. This is a simple request that requires only a URL.
    //makeRequest will except any valid request bject supported by the npm request
    //module - https://www.npmjs.com/package/request#requestoptions-callback.
    var requestConfig = {
      url: 'http://services.faa.gov/airport/status/SFO?format=application/json'
    };

    //The makeRequest will hand us back a stream. The data is a buffer by default, but you can add
    //a 2nd param to request it back as a string or as json.  Once we get it back we'll pickout just
    //a few properties to focus on.  It's always best to keep the stream as lite as possible.
    transform.Plugins.Core.Http.makeRequest(requestConfig, 'json')
      .pipe(transform.countStream('Step1', 'in'))
        .pipe(transform.Plugins.Core.Utils.pluckProperties(['IATA', 'name', 'delay']))
      .pipe(transform.countStream('Step1', 'out'))
      .on('data', function(resultingData) {
        //NOTE: This listener must exist, even if it does nothing. Otherwise, the end event is not fired.

        //Uncomment to dump the resulting data for debugging
        console.log(resultingData);
      })
      .on('end', function() {
        transform.Plugins.Core.Logger.info('Transform finished!');
        transform.printStepProfilingReport();
        process.exit();
      });
  })
  .catch(function(err) {
    transform.Plugins.Core.Logger.error('ETL process failed:', err);
    process.exit();
  });

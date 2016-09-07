'use strict';

/**
 * Example: Query and sort...
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var transform = new Nextract("queryAndSort");

transform.loadPlugins('Core', ['Database', 'Sort', 'Logger']).then(function () {
  //ETL plugins have been loaded, get a readStream to start the job with
  return transform.Plugins.Core.Database.selectQuery('nextract_sample', 'select first_name, last_name, age from employees', {});
}).then(function (dbDataStream) {
  dbDataStream.pipe(transform.Plugins.Core.Sort.sortBy(['age'], ['asc'])).on('data', function (resultingData) {
    //NOTE: This listener must exist, even if it does nothing. Otherwise, the end event is not fired.

    //Uncomment to dump the resulting data for debugging
    console.log("resultingData", resultingData);
  }).on('end', function () {
    transform.Plugins.Core.Logger.info('Transform finished!');
  });
}).catch(function (err) {
  transform.Plugins.Core.Logger.error('Transform failed: ', err);
});

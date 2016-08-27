/**
 * Example: Query and sort...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Database', 'Logger'])
    .then(function() {
      return etlJob.Plugins.Core.Database.selectQuery('pg_sample', 'select * from page');
    })
    .then(function(data) {
      etlJob.Plugins.Core.Logger.info('Sorted queryResults: ', data);
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.error('etlJob process failed: ', err);
    });

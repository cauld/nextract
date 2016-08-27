/**
 * Example: Query and sort...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Database', 'Sort', 'Logger'])
    .then(function() {
      return etlJob.Plugins.Core.Database.selectQuery('nextract_sample', 'select first_name, last_name from employees');
    })
    .then(function(data) {
      return etlJob.Plugins.Core.Sort.orderBy(data, ['last_name'], ['desc']);
    })
    .then(function(data) {
      etlJob.Plugins.Core.Logger.info('Sorted queryResults: ', data);
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.error('etlJob process failed: ', err);
    });

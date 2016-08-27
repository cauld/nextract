'use strict';

/**
 * Example: Parameterized query
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Database', 'Sort', 'Logger']).then(function () {
  var sql = 'select first_name, last_name from employees where age >= :age';
  var sqlReplacements = { 'age': 30 };

  return etlJob.Plugins.Core.Database.selectQuery('nextract_sample', sql, sqlReplacements);
}).then(function (data) {
  etlJob.Plugins.Core.Logger.info('Query Results: ', data);
}).catch(function (err) {
  etlJob.Plugins.Core.Logger.error('etlJob process failed: ', err);
});

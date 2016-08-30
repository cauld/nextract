"use strict";

/**
 * Example: Filter and group data...
 */

/*
var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Database', 'Filter', 'GroupBy', 'Logger'])
    .then(function() {
      return etlJob.Plugins.Core.Database.selectQuery('nextract_sample', 'select first_name, last_name, age, salary from employees');
    })
    .then(function(data) {
      return etlJob.Plugins.Core.Filter.greaterThan(data, 'age', 30);
    })
    .then(function(data) {
      return etlJob.Plugins.Core.GroupBy.sumBy(data, 'salary');
    })
    .then(function(data) {
      etlJob.Plugins.Core.Logger.info('Together they make:', data);
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.info('etlJob process failed:', err);
    });
*/

console.log("Reimplement example once file input is streaming and once the sort plugin is reworked!");

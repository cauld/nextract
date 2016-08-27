/**
 * Example: Query and sort...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Database', 'Calculator', 'Logger'])
    .then(function() {
      return etlJob.Plugins.Core.Database.selectQuery('nextract_sample', 'select first_name, last_name, age, salary from employees');
    })
    .then(function(data) {
      return etlJob.Plugins.Core.Calculator.add(data, 'salary', 1000, 'new_salary');
    })
    .then(function(data) {
      //Lets add a new full name property
      return etlJob.Plugins.Core.Calculator.concat(data, ['Mr/Mrs:', 'first_name', 'last_name'], ' ', 'full_name');
    })
    .then(function(data) {
      etlJob.Plugins.Core.Logger.debug('Manipulated queryResults:', data);
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.error('etlJob process failed:', err);
    });

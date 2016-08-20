/**
 * Example: Query and sort...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.loadPlugin('Core', ['Database', 'Calculator', 'Logger'])
    .then(function() {
      return ETL.Plugins.Core.Database.select('nextract_sample', 'select age, salary from users');
    })
    .then(function(data) {
      return ETL.Plugins.Core.Calculator.add(data, 'salary', 1000, 'new_salary');
    })
    .then(function(data) {
      ETL.Plugins.Core.Logger.info('Added queryResults:', data);
    })
    .catch(function(err) {
      ETL.Plugins.Core.Logger.error('ETL process failed:', err);
    });

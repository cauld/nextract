/**
 * Example: Filter and group data...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.loadPlugin('Core', ['Database', 'Filter', 'GroupBy', 'Logger'])
    .then(function() {
      return ETL.Plugins.Core.Database.select('nextract', 'select first_name, last_name, age, salary from users');
    })
    .then(function(data) {
      return ETL.Plugins.Core.Filter.greaterThan(data, 'age', 30);
    })
    .then(function(data) {
      return ETL.Plugins.Core.GroupBy.sumBy(data, 'salary');
    })
    .then(function(data) {
      ETL.Plugins.Core.Logger.info('Together they make: ', data);
    })
    .catch(function(err) {
      ETL.Plugins.Core.Logger.info('ETL process failed: ', err);
    });

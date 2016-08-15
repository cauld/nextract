/**
 * Example: Filter and group data...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.mixin('core', ['Db', 'Filter', 'GroupBy', 'Logger'])
    .then(function() {
      return ETL.Db.query('nextract', 'select first_name, last_name, age, salary from users');
    })
    .then(function(data) {
      return ETL.Filter.greaterThan(data, 'age', 30);
    })
    .then(function(data) {
      return ETL.GroupBy.sumBy(data, 'salary');
    })
    .then(function(data) {
      ETL.Logger.info('Together they make: ', data);
    })
    .catch(function(err) {
      ETL.Logger.info('ETL process failed: ', err);
    });

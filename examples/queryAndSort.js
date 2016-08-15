/**
 * Example: Query and sort...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.mixin('core', ['Db', 'Sort', 'Logger'])
    .then(function() {
      return ETL.Db.query('nextract', 'select first_name, last_name from users');
    })
    .then(function(data) {
      return ETL.Sort.by(data, ['first_name', 'last_name'], ['desc', 'desc']);
    })
    .then(function(data) {
      ETL.Logger.info('Sorted queryResults: ', data);
    })
    .catch(function(err) {
      ETL.Logger.error('ETL process failed: ', err);
    });

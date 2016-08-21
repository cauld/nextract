/**
 * Example: Parameterized query
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.loadPlugin('Core', ['Database', 'Sort', 'Logger'])
    .then(function() {
      var sql = 'select first_name, last_name from users where last_name = :last_name';
      var sqlReplacements = { 'last_name': 'smith' };

      return ETL.Plugins.Core.Database.select('nextract_sample', sql, sqlReplacements);
    })
    .then(function(data) {
      ETL.Plugins.Core.Logger.info('Query Results: ', data);
    })
    .catch(function(err) {
      ETL.Plugins.Core.Logger.error('ETL process failed: ', err);
    });

'use strict';

/**
 * Example: Query and sort...
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.loadPlugin('Core', ['Database', 'Sort', 'Logger']).then(function () {
  return ETL.Plugins.Core.Database.select('nextract_sample', 'select first_name, last_name from users');
}).then(function (data) {
  return ETL.Plugins.Core.Sort.orderBy(data, ['first_name', 'last_name'], ['desc', 'desc']);
}).then(function (data) {
  ETL.Plugins.Core.Logger.info('Sorted queryResults: ', data);
}).catch(function (err) {
  ETL.Plugins.Core.Logger.error('ETL process failed: ', err);
});

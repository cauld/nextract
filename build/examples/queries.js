'use strict';

/**
 * Example: Query and sort...
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.loadPlugin('Core', ['Database', 'Calculator', 'Logger']).then(function () {
  return ETL.Plugins.Core.Database.selectQuery('nextract_sample', 'select first_name, last_name from users');
}).then(function (userData) {
  var deleteCriteria = [{ tableColumn: 'first_name', comparator: '=', collectionField: 'first_name' }, { tableColumn: 'last_name', comparator: '=', collectionField: 'last_name' }];

  return ETL.Plugins.Core.Database.deleteQuery('nextract_sample', 'users_copy', userData, deleteCriteria);
}).then(function (data) {
  ETL.Plugins.Core.Logger.debug('Manipulated queryResults:', data);
}).catch(function (err) {
  ETL.Plugins.Core.Logger.error('ETL process failed:', err);
});

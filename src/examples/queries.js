/**
 * Example: Query and sort...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

ETL.loadPlugin('Core', ['Database', 'Calculator', 'Logger'])
    .then(function() {
      return ETL.Plugins.Core.Database.selectQuery('nextract_sample', "select id, first_name, last_name from users where last_name = 'smith'");
    })
    .then(function(queryResults) {
      /*
      var smithUserData,
          matchCriteria;

      smithUserData = queryResults[0];
      smithUserData.first_name = 'Taz';

      matchCriteria = [{ tableColumn: 'id', comparator: '=', collectionField: 'id' }];

      return ETL.Plugins.Core.Database.updateQuery('nextract_sample', 'users', [smithUserData], ['first_name'], matchCriteria);
      */

      var collectionsToInsert = [];
      for(var i=0; i<3436; i++) {
        collectionsToInsert[collectionsToInsert.length] = { 'first_name': makeid(), 'last_name': makeid(), 'age': 40 };
      }

      var columnsToInsert = ['first_name', 'last_name', 'age'];

      return ETL.Plugins.Core.Database.insertQuery('nextract_sample', 'users', collectionsToInsert, columnsToInsert);
    })
    .then(function(data) {
      ETL.Plugins.Core.Logger.debug('Manipulated queryResults:', data);
    })
    .catch(function(err) {
      ETL.Plugins.Core.Logger.error('ETL process failed:', err);
    });

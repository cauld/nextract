/**
 * Example: CSV input and sort...
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.mixin('core', ['Input', 'Sort', 'Logger'])
    .then(function() {
      var sampleUsersFilePath = path.resolve(process.cwd(), 'data/users.csv');
      return ETL.Input.readFile('csv', sampleUsersFilePath);
    })
    .then(function(data) {
      return ETL.Sort.by(data, ['last_name'], ['asc']);
    })
    .then(function(data) {
      ETL.Logger.info("Sorted queryResults", data);
    })
    .catch(function(err) {
      ETL.Logger.log("ETL process failed: ", err);
    });

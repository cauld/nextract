var _          = require('lodash'),
    path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.mixin('core', ['Input', 'Sort'])
    .then(function() {
      var sampleUsersFilePath = path.resolve(process.cwd(), 'data/users.csv');
      return ETL.Input.readFile('csv', sampleUsersFilePath);
    })
    .then(function(data) {
      return ETL.Sort.by(data, ['last_name'], ['asc']);
    })
    .then(function(data) {
      console.log("Sorted queryResults", data);
    })
    .catch(function(err) {
      console.log("ETL process failed: ", err);
    });

/**
 * Example: JSON input and sort...
 */

var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

var sampleUsersInputFilePath = path.resolve(process.cwd(), 'data/users.json'),
    sampleUsersOutputFilePath = path.resolve(process.cwd(), 'data/users_output.json');

ETL.mixin('core', ['Input', 'Output', 'Sort', 'Logger'])
    .then(function() {
      return ETL.Input.readFile('json', sampleUsersInputFilePath);
    })
    .then(function(jsonData) {
      var userData = jsonData.data.users;
      return ETL.Sort.by(userData, ['last_name'], ['asc']);
    })
    .then(function(data) {
      ETL.Logger.info('Sorted queryResults: ', data);
      return ETL.Output.writeFile('json', sampleUsersOutputFilePath, data, { spaces: 4 });
    })
    .then(function() {
      ETL.Logger.info(sampleUsersOutputFilePath, 'has been written');
    })
    .catch(function(err) {
      ETL.Logger.error('ETL process failed: ', err);
    });

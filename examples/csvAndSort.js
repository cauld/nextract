/**
 * Example: CSV input and sort...
 */

var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

var sampleUsersInputFilePath = path.resolve(process.cwd(), 'data/users.csv'),
    sampleUsersOutputFilePath = path.resolve(process.cwd(), 'data/users_output.csv');

ETL.mixin('core', ['Input', 'Output', 'Sort', 'Logger'])
    .then(function() {
      return ETL.Input.readFile('csv', sampleUsersInputFilePath);
    })
    .then(function(data) {
      return ETL.Sort.by(data, ['last_name'], ['asc']);
    })
    .then(function(data) {
      ETL.Logger.info('Sorted queryResults: ', data);
      return ETL.Output.writeFile('csv', sampleUsersOutputFilePath, data);
    })
    .then(function() {
      ETL.Logger.info(sampleUsersOutputFilePath, 'has been written');
    })
    .catch(function(err) {
      ETL.Logger.error('ETL process failed: ', err);
    });

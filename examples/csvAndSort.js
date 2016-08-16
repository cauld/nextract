/**
 * Example: CSV input and sort...
 */

var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

var sampleUsersInputFilePath = path.resolve(process.cwd(), 'data/users.csv'),
    sampleUsersOutputFilePath = path.resolve(process.cwd(), 'data/users_output.csv');

ETL.loadPlugin('Core', ['Input', 'Output', 'Sort', 'Logger'])
    .then(function() {
      return ETL.Plugins.Core.Input.readFile('csv', sampleUsersInputFilePath);
    })
    .then(function(data) {
      return ETL.Plugins.Core.Sort.by(data, ['last_name'], ['asc']);
    })
    .then(function(data) {
      ETL.Plugins.Core.Logger.info('Sorted queryResults: ', data);
      return ETL.Plugins.Core.Output.writeFile('csv', sampleUsersOutputFilePath, data);
    })
    .then(function() {
      ETL.Plugins.Core.Logger.info(sampleUsersOutputFilePath, 'has been written');
    })
    .catch(function(err) {
      ETL.Plugins.Core.Logger.error('ETL process failed: ', err);
    });

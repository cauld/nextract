'use strict';

/**
 * Example: JSON input and sort...
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

var sampleUsersInputFilePath = path.resolve(process.cwd(), 'data/users.json'),
    sampleUsersOutputFilePath = path.resolve(process.cwd(), 'data/users_output.json');

ETL.loadPlugin('Core', ['Input', 'Output', 'Sort', 'Logger']).then(function () {
  return ETL.Plugins.Core.Input.readFile('json', sampleUsersInputFilePath);
}).then(function (jsonData) {
  var userData = jsonData.data.users;
  return ETL.Plugins.Core.Sort.by(userData, ['last_name'], ['asc']);
}).then(function (data) {
  ETL.Plugins.Core.Logger.info('Sorted queryResults: ', data);
  return ETL.Plugins.Core.Output.writeFile('json', data, sampleUsersOutputFilePath, { spaces: 2 });
}).then(function () {
  ETL.Plugins.Core.Logger.info(sampleUsersOutputFilePath, 'has been written');
}).catch(function (err) {
  ETL.Plugins.Core.Logger.error('ETL process failed: ', err);
});

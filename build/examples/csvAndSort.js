"use strict";

/**
 * Example: CSV input and sort...
 */

/*
var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var sampleEmployeesInputFilePath = path.resolve(process.cwd(), 'data/employees.csv'),
    sampleEmployeesOutputFilePath = path.resolve(process.cwd(), 'data/employees_output.csv');

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger'])
    .then(function() {
      return etlJob.Plugins.Core.Input.readFile('csv', sampleEmployeesInputFilePath);
    })
    .then(function(data) {
      return etlJob.Plugins.Core.Sort.orderBy(data, ['last_name'], ['asc']);
    })
    .then(function(data) {
      etlJob.Plugins.Core.Logger.info('Sorted queryResults: ', data);

      //Take the keys from the first record and use them to make a csv header
      var csvConfig = {
        header: true,
        columns: Object.keys(data[0])
      };

      return etlJob.Plugins.Core.Output.writeFile('csv', data, sampleEmployeesOutputFilePath, csvConfig);
    })
    .then(function() {
      etlJob.Plugins.Core.Logger.info(sampleEmployeesOutputFilePath, 'has been written');
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.error('ETL process failed: ', err);
    });
*/

console.log("Reimplement example once file input is streaming and once the sort plugin is reworked!");

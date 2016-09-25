'use strict';

/**
 * Example: CSV input and sort...
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var sampleEmployeesInputFilePath = path.resolve(process.cwd(), 'data/employees.csv'),
    sampleEmployeesOutputFilePath = path.resolve(process.cwd(), 'data/employees_output.csv');

var transform = new Nextract("csvAndSort");

transform.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger']).then(function () {
  //Take the keys from the first record and use them to make a csv header
  var outputCsvConfig = {
    header: true,
    columns: {
      first_name: 'first_name',
      last_name: 'last_name',
      age: 'age',
      salary: 'salary'
    }
  };

  transform.Plugins.Core.Input.readCsvFile(sampleEmployeesInputFilePath)
  //FIXME: Sort never gets the EOF signal from Input.readFile...
  //.pipe(transform.Plugins.Core.Sort.sortIn(['last_name'], ['asc']))
  //.pipe(transform.Plugins.Core.Sort.sortOut())
  .pipe(transform.Plugins.Core.Output.toCsvString(outputCsvConfig, sampleEmployeesOutputFilePath)).pipe(transform.Plugins.Core.Output.toFile(sampleEmployeesOutputFilePath)).on('data', function (resultingData) {
    //NOTE: This listener must exist, even if it does nothing. Otherwise, the end event is not fired.

    //Uncomment to dump the resulting data for debugging
    console.log("resultingData", resultingData);
    //console.log("resultingData", resultingData.toString());
  }).on('finish', function () {
    transform.Plugins.Core.Logger.info('Transform finished!');
    transform.Plugins.Core.Logger.info(sampleEmployeesOutputFilePath, 'has been written');
  }).on('end', function () {
    transform.Plugins.Core.Logger.info('Transform ended!');
    transform.Plugins.Core.Logger.info('NOTE: Example still a WIP! ...');
    process.exit();
  });
}).catch(function (err) {
  transform.Plugins.Core.Logger.error('Transform failed: ', err);
  process.exit();
});

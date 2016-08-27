/**
 * Example: JSON input and sort...
 */

var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var etlJob = new Nextract();

var sampleEmployeesInputFilePath = path.resolve(process.cwd(), 'data/employees.json'),
    sampleEmployeesOutputFilePath = path.resolve(process.cwd(), 'data/employees_output.json');

etlJob.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger'])
    .then(function() {
      return etlJob.Plugins.Core.Input.readFile('json', sampleEmployeesInputFilePath);
    })
    .then(function(jsonData) {
      var employeesData = jsonData.data.employees;
      return etlJob.Plugins.Core.Sort.orderBy(employeesData, ['last_name'], ['desc']);
    })
    .then(function(data) {
      etlJob.Plugins.Core.Logger.info('Sorted queryResults:', data);
      return etlJob.Plugins.Core.Output.writeFile('json', data, sampleEmployeesOutputFilePath, { spaces: 2 });
    })
    .then(function() {
      etlJob.Plugins.Core.Logger.info(sampleEmployeesOutputFilePath, 'has been written');
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.error('etlJob process failed:', err);
    });

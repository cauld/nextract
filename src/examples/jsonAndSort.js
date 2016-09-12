/**
 * Example: JSON input and sort...
 */

var path     = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var sampleEmployeesInputFilePath = path.resolve(process.cwd(), 'data/employees.json'),
    sampleEmployeesOutputFilePath = path.resolve(process.cwd(), 'data/employees_output.json');

var transform = new Nextract("jsonAndSort");

transform.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger'])
  .then(function() {
    transform.Plugins.Core.Input.readJsonFile(sampleEmployeesInputFilePath, 'data.employees.*')
      //FIXME: Sort never gets the EOF signal from Input.readFile...
      //.pipe(transform.Plugins.Core.Sort.sortIn(['last_name'], ['asc']))
      //.pipe(transform.Plugins.Core.Sort.sortOut())
      .pipe(transform.Plugins.Core.Output.toJsonString(true))
      .pipe(transform.Plugins.Core.Output.toFile(sampleEmployeesOutputFilePath))
      .on('data', function(resultingData) {
        //NOTE: This listener must exist, even if it does nothing. Otherwise, the end event is not fired.

        //Uncomment to dump the resulting data for debugging
        //console.log("resultingData", resultingData);
        //console.log("resultingData", resultingData.toString());
      })
      .on('finish', function(){
        transform.Plugins.Core.Logger.info('Transform finished!');
        transform.Plugins.Core.Logger.info(sampleEmployeesOutputFilePath, 'has been written');
      })
      .on('end', function() {
        transform.Plugins.Core.Logger.info('Transform ended!');
        transform.Plugins.Core.Logger.info('NOTE: Example still a WIP! ...');
      });
  })
  .catch(function(err) {
    transform.Plugins.Core.Logger.error('Transform failed: ', err);
  });

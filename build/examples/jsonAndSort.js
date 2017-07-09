'use strict';

/**
 * Example: JSON input and sort...
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var sampleEmployeesInputFilePath = path.resolve(process.cwd(), 'data/employees.json'),
    sampleEmployeesOutputFilePath = path.resolve(process.cwd(), 'data/employees_output.json');

var transform = new Nextract('jsonAndSort');

transform.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger']).then(function () {
  return new Promise(function (resolve) {
    //STEP 1: Read data in from a JSON file (we specify the object path we care about)
    transform.Plugins.Core.Input.readJsonFile(sampleEmployeesInputFilePath, 'data.employees.*')
    //STEP 2: Pass data in to be sorted (1 element is pushed back and it is the expected input
    //for a new stream read call to sortOut)
    .pipe(transform.Plugins.Core.Sort.sortIn(['last_name'], ['asc'])).on('data', function (sortInDbInfo) {
      if (sortInDbInfo !== undefined) {
        resolve(sortInDbInfo);
      }
    });
  });
}).then(function (sortInDbInfo) {
  transform.Plugins.Core.Sort.sortOut(sortInDbInfo)
  //STEP 3: We want to write the sorted data back out to a new JSON file so first we use
  //toJsonString to stringify the stream.
  .pipe(transform.Plugins.Core.Output.toJsonString(true))
  //STEP 4: Write out the new file
  .pipe(transform.Plugins.Core.Output.toFile(sampleEmployeesOutputFilePath)).on('finish', function () {
    transform.Plugins.Core.Logger.info('Transform finished!');
    transform.Plugins.Core.Logger.info(sampleEmployeesOutputFilePath, 'has been written');
  }).on('end', function () {
    transform.Plugins.Core.Logger.info('Transform ended!');
    process.exit();
  });
}).catch(function (err) {
  transform.Plugins.Core.Logger.error('Transform failed: ', err);
});

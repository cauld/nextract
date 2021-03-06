'use strict';

/**
 * Example: Demonstrates querying, filtering, calcs, and profiling 
 * NOTE: requires setting up the sample MySQL database
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../../nextract'));

var transform = new Nextract('queryAndSort');

transform.loadPlugins('Core', ['Database', 'Filter', 'Calculator', 'Utils', 'Logger']).then(function () {
  transform.Plugins.Core.Database.selectQuery('nextract_sample', 'select first_name, last_name, age from employees', []).pipe(transform.countStream('Step1', 'in')).pipe(transform.Plugins.Core.Filter.greaterThan('age', 30)).pipe(transform.countStream('Step1', 'out')).pipe(transform.countStream('Step2', 'in')).pipe(transform.Plugins.Core.Calculator.add('age', 10, 'age')).pipe(transform.countStream('Step2', 'out')).pipe(transform.countStream('Step3', 'in')).pipe(transform.Plugins.Core.Calculator.concat(['first_name', 'last_name'], ' ', 'full_name')).pipe(transform.countStream('Step3', 'out')).pipe(transform.countStream('Step4', 'in')).pipe(transform.Plugins.Core.Utils.pluckProperties(['full_name', 'age'])).pipe(transform.countStream('Step4', 'out')).on('data', function (resultingData) {
    //NOTE: This listener must exist, even if it does nothing. Otherwise, the end event is not fired.

    //Uncomment to dump the resulting data for debugging
    console.log(resultingData);
  }).on('end', function () {
    transform.Plugins.Core.Logger.info('Transform finished!');
    transform.printStepProfilingReport();
    process.exit();
  });
}).catch(function (err) {
  transform.Plugins.Core.Logger.error('Transform failed: ', err);
  process.exit();
});

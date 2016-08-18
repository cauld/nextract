'use strict';

/**
 * Example: Running some ETL tasks in parallel
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

var ETL = new Nextract();

ETL.loadPlugin('Core', ['Database', 'Utils', 'Logger']).then(function () {
  var task1, task2;

  //ETL tasks don't always have to be run serially. What we needed the results of 2 different queries
  //before we could run a 3rd calculation step.  We could run 1, then the next, and then do teh calc.
  //However, since both queries are indiependt we could run them at the same time getting us back some
  //precious run time.  To do this we start by getting a handle on the Promise returned for each task.
  task1 = ETL.Plugins.Core.Database.select('nextract_sample', 'select salary from users where id = 1');
  task2 = ETL.Plugins.Core.Database.select('nextract_sample', 'select salary from users where id = 2');

  //Now we build an array of tasks that we want to run in parallel
  var parallelTasks = [task1, task2];

  //Finally we call runAll which will trigger each task.  RunAll returns a Promise that will only be
  //resolved once all tasks have completed.
  return ETL.Plugins.Core.Utils.runAll(parallelTasks);
}).then(function (runAllResponse) {
  //runAllResponse will contain an array with the resolved result of each task
  var task1Salary = runAllResponse[0][0].salary;
  var task2Salary = runAllResponse[1][0].salary;

  ETL.Plugins.Core.Logger.info('Together these people make:', task1Salary + task2Salary);
}).catch(function (err) {
  ETL.Plugins.Core.Logger.error('ETL process failed: ', err);
});

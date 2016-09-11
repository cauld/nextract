'use strict';

/**
 * Example: Query and sort...
 */

var path = require('path'),
    Nextract = require(path.resolve(__dirname, '../nextract'));

/*
//Profiler loads up and EP object into the global space
require('easy-profiler');

function runStep(stepKey, stepPromise) {
  return new Promise(function(resolve) {
    EP.begin(EP.keys[stepKey]);

    stepPromise
      .then(function(stepData) {
        EP.end(EP.keys[stepKey]);
        resolve(stepData);
      });
  });
}
*/

/* Main */

//Give each step a unique key and friendly name/desc
/*
var etlJobSteps = {
  STEP_1: "Query db for page data",
  STEP_2: "Join db for more page data",
  STEP_3: "Run a calculator step (add 100 to page counter)",
  STEP_4: "Pluck subset of collection properties",
  STEP_5: "Sort by page title",
  STEP_6: "Filter pages by page counter totals",
  STEP_7: "Insert collection into a different target database"
};

//Register step keys
EP.keys.add(etlJobSteps);
*/

var transform = new Nextract("benchmark");

console.log("Starting transform... ", new Date());

transform.loadPlugins('Core', ['Database', 'Filter', 'Calculator', 'Sort', 'Utils', 'Logger']).then(function () {
  //STEP 1: Lets start by selecting out a large set of data
  var selectSql = 'select page_id from page LIMIT 1000000';
  return transform.Plugins.Core.Database.selectQuery('nextract_sample', selectSql, {});
}).then(function (dbDataStream) {
  //STEP 2: Lets join back to the same table and pickup more rows (yes normally you'd get them all in the select, but we
  //want to simulate a lot of joins.
  var step2JoinSQL = 'select page_namespace, page_title, page_counter, page_is_redirect, page_is_new, page_random,' + 'page_touched, page_latest, page_len from page where page_id = :page_id';

  var step7ColumnsToInsert = ['page_title', 'page_counter', 'page_random', 'page_latest', 'page_len'];

  dbDataStream.pipe(transform.Plugins.Core.Database.joinQuery('nextract_sample', step2JoinSQL, false))
  //STEP 3: ETL operations are most often performed on the entire collection. Here we are taking the page_counter of each collection item
  //and raising it by 100.  We could choose to store this new value in new collection properity or simply overwrite the existing one.
  //Here we'll just overwrite the existing one.
  .pipe(transform.Plugins.Core.Calculator.add('page_counter', 100, 'page_counter'))
  //STEP 4: It is always best to reduce the collection down to only the data you really need for performance reasons.
  //So here we pick out only a subject of the current collection properties.
  .pipe(transform.Plugins.Core.Utils.pluckProperties(['page_title', 'page_counter', 'page_random', 'page_latest', 'page_len']))
  //STEP 5: Sort the data
  .pipe(transform.Plugins.Core.Sort.sortIn(['page_title'], ['asc'])).pipe(transform.Plugins.Core.Sort.sortOut())
  //STEP 6: Filter collection for records with page_counter > 200
  .pipe(transform.Plugins.Core.Filter.greaterThan('page_counter', 10))
  //STEP 7: Insert into a 2nd database (to demo cross db support)
  .pipe(transform.Plugins.Core.Database.insertQuery('nextract_pg_sample', 'page', step7ColumnsToInsert)).on('data', function (resultingData) {
    //NOTE: This listener must exist, even if it does nothing. Otherwise, the end event is not fired.

    //Uncomment to dump the resulting data for debugging
    //console.log("resultingData", resultingData.length);
    //console.log("resultingData", resultingData);
  }).on('finish', function () {
    transform.Plugins.Core.Logger.info('Transform finished!', new Date());
  }).on('end', function () {
    transform.Plugins.Core.Logger.info('Transform ended!');
  });
}).catch(function (err) {
  transform.Plugins.Core.Logger.error('Transform failed: ', err);
});

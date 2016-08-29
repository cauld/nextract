/**
 * Example: Query and sort...
 */

var path         = require('path'),
    Nextract     = require(path.resolve(__dirname, '../nextract'));

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

/* Main */

//Give each step a unique key and friendly name/desc
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

var etlJob = new Nextract();

etlJob.loadPlugins('Core', ['Database', 'Filter', 'Calculator', 'Sort', 'Utils', 'Logger'])
    .then(function() {
      //STEP 1: Lets start by selecting out a large set of data
      var selectSql = 'select page_id from page LIMIT 100';
      var stepPromise = etlJob.Plugins.Core.Database.selectQuery('nextract_sample', selectSql);

      return runStep('STEP_1', stepPromise);
    })
    .then(function(pageData) {
      //STEP 2: Lets join back to the same table and pickup more rows (yes normally you'd get them all in the select, but we
      //want to simulate a lot of joins.
      var joinSQL = 'select page_namespace, page_title, page_restrictions, page_counter, page_is_redirect, page_is_new, page_random,' +
                    'page_touched, page_latest, page_len from page where page_id = :page_id';
      var stepPromise = etlJob.Plugins.Core.Database.joinQuery('nextract_sample', joinSQL, pageData, false);

      return runStep('STEP_2', stepPromise);
    })
    .then(function(pageData) {
      //STEP 3: ETL operations are most often performed on the entire collection. Here we are taking the page_counter of each collection item
      //and raising it by 100.  We could choose to store this new value in new collection properity or simply overwrite the existing one.
      //Here we'll just overwrite the existing one.
      var stepPromise = etlJob.Plugins.Core.Calculator.add(pageData, 'page_counter', 100, 'page_counter');

      return runStep('STEP_3', stepPromise);
    })
    .then(function(pageData) {
      //STEP 4: It is always best to reduce the collection down to only the data you really need for performance reasons.
      //So here we pick out only a subject of the current collection properties.
      var propertiesOfInterest = ['page_title', 'page_counter', 'page_random', 'page_latest', 'page_len'];
      var stepPromise = etlJob.Plugins.Core.Utils.pluckProperties(pageData, propertiesOfInterest);

      return runStep('STEP_4', stepPromise);
    })
    .then(function(pageData) {
      //STEP 5: Sort the data
      var stepPromise = etlJob.Plugins.Core.Sort.sortBy(pageData, 'page_title');

      return runStep('STEP_5', stepPromise);
    })
    .then(function(pageData) {
      //STEP 6: Filter collection for records with page_counter > 200
      var stepPromise = etlJob.Plugins.Core.Filter.greaterThan(pageData, 'page_counter', 200);

      return runStep('STEP_6', stepPromise);
    })
    .then(function(pageData) {
      //STEP 7: Insert into a 2nd database (to demo cross db support)
      var columnsToInsert = ['page_title', 'page_counter', 'page_random', 'page_latest', 'page_len'];
      var stepPromise = etlJob.Plugins.Core.Database.insertQuery('nextract_pg_sample', 'page', pageData, columnsToInsert);

      return runStep('STEP_7', stepPromise);
    })
    .then(function() {
      var d = new Date();
      etlJob.Plugins.Core.Logger.info('ETL job complete!', d);

      //Print the final profiling report
      EP.report(true);
    })
    .catch(function(err) {
      etlJob.Plugins.Core.Logger.error('ETL process failed:', err);
    });

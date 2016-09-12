'use strict';

/**
 * Example: Query and sort...
 */

var path = require('path'),
    objectStream = require('object-stream'),
    Nextract = require(path.resolve(__dirname, '../nextract')),
    exampleUtils = require(path.resolve(__dirname, './exampleUtils'));

/* MAIN */

var transform = new Nextract("queries");

console.log("Starting transform... ", new Date());

transform.loadPlugins('Core', ['Database', 'Filter', 'Calculator', 'Utils', 'Logger']).then(function () {
  //Lets generate a bunch of new employees and create a collection (i.e.) an array of objects
  var collectionsToInsert = [];
  for (var i = 0; i < 50; i++) {
    collectionsToInsert[collectionsToInsert.length] = {
      'first_name': exampleUtils.getRandomString(),
      'last_name': exampleUtils.getRandomString(),
      'age': exampleUtils.getRandomInt(18, 65),
      'salary': exampleUtils.getRandomInt(20000, 80000)
    };
  }

  return objectStream.fromArray(collectionsToInsert);
}).then(function (dummyDataStream) {
  return new Promise(function (resolve) {
    //Step 1: A collection can have many properties and we might not always which to insert them all. So we are required to pass an array of properties
    //that we want to insert.  Since we do want them all in this case we could just grab the keys from the collection item.
    var step1ColumnsToInsert = ['first_name', 'last_name', 'age', 'salary'];

    dummyDataStream.pipe(transform.Plugins.Core.Database.insertQuery('nextract_sample', 'employees', step1ColumnsToInsert));

    //Pause for a moment to let the streaming insert of dummy data to finish
    setTimeout(function () {
      resolve();
    }, 3000);
  });
}).then(function () {
  //Step 2: Now that we've loaded some new employees into the employees table, lets find them all and give them all a raise.
  //Get a readStream to start the job with
  return transform.Plugins.Core.Database.selectQuery('nextract_sample', 'select id, first_name, last_name, salary from employees', {});
}).then(function (dbDataStream) {
  var step4JoinSql = 'select age from employees where id = :id';

  //Define the step 6 & 8 match matchCriteria which in this case is a simple primary key match on id. Can
  //be made up of the several fields if needed.
  var step6And8MatchCriteria = [{ tableColumn: 'id', comparator: '=', collectionField: 'id' }];

  dbDataStream
  //Step 3: Transform operations are most often performed on the entire collection. Here we are taking the salary of each collection item
  //and raising it by 1000.  We could choose to store this new value in new collection properity or simply overwrite the existing one.
  //Here we'll just overwrite the existing one.
  .pipe(transform.Plugins.Core.Calculator.add('salary', 1000, 'salary'))
  //Step 4: Elements flowing through the stream now have the updated salary. I left age out of selectQuery
  //call so that I could demonstrate a collection join.  Lets find the age of all these employees.
  .pipe(transform.Plugins.Core.Database.joinQuery('nextract_sample', step4JoinSql, false))
  //Step 5: Elements flowing through the stream now also contains the age for each matching row. Lets give them
  //all back 10 years of their life.
  .pipe(transform.Plugins.Core.Calculator.subtract('age', 10, 'age'))
  //Step 6: Lets updated the database now with these new salary & age properties
  .pipe(transform.Plugins.Core.Database.updateQuery('nextract_sample', 'employees', ['salary', 'age'], step6And8MatchCriteria))
  //Uncomment this next pipe() to output each stream element so that you can visually see the updated object
  //.pipe(transform.Plugins.Core.Utils.streamConsoleLogStreamItem())
  //Step 7: The company has decided to reduce overhead. We need to find all employees making over 60k.
  //For this we filter the collection down and call deleteQuery for each remaining row.
  .pipe(transform.Plugins.Core.Filter.greaterThan('salary', 59999))
  //Step 8: We need to remove all employees making over 60k.
  .pipe(transform.Plugins.Core.Database.deleteQuery('nextract_sample', 'employees', step6And8MatchCriteria)).on('data', function (resultingData) {
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

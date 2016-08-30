/**
 * Example: Query and sort...
 */

/*
var path         = require('path'),
    Nextract     = require(path.resolve(__dirname, '../nextract')),
    exampleUtils = require(path.resolve(__dirname, './exampleUtils'));


var transform = new Nextract();

transform.loadPlugins('Core', ['Database', 'Filter', 'Calculator', 'Logger'])
    .then(function() {
      //Lets generate a bunch of new employees and create a collection (i.e.) an array of objects
      var collectionsToInsert = [];
      for(var i=0; i<50; i++) {
        collectionsToInsert[collectionsToInsert.length] = {
          'first_name': exampleUtils.getRandomString(),
          'last_name': exampleUtils.getRandomString(),
          'age': exampleUtils.getRandomInt(18, 65),
          'salary': exampleUtils.getRandomInt(20000, 80000)
        };
      }

      //A collection can have many properties and we might not always which to insert them all. So we are required to pass an array of properties
      //that we want to insert.  Since we do want them all in this case we could just grab the keys from the collection item.
      var columnsToInsert = ['first_name', 'last_name', 'age', 'salary']; //or Object.keys(collectionsToInsert[0]);

      //Insert our collection
      return transform.Plugins.Core.Database.insertQuery('nextract_sample', 'employees', collectionsToInsert, columnsToInsert);
    })
    .then(function() {
      //Now that we've loaded some new employees into the employees table, lets find them all and give them all a raise.
      var selectSql = 'select id, first_name, last_name, age, salary from employees';
      return transform.Plugins.Core.Database.selectQuery('nextract_sample', selectSql);
    })
    .then(function(queryResults) {
      //transform operations are most often performed on the entire collection. Here we are taking the salary of each collection item
      //and raising it by 1000.  We could choose to store this new value in new collection properity or simply overwrite the existing one.
      //Here we'll just overwrite the existing one.
      return transform.Plugins.Core.Calculator.add(queryResults, 'salary', 1000, 'salary');
    })
    .then(function(manipulatedCollection) {
      //manipulatedCollection now contains our collection with the updated salary. I left age out of selectQuery
      //call so that I could demonstrate a collection join.  Lets find the age of all these employees.
      var joinSQL = 'select age from employees where id = :id';
      return transform.Plugins.Core.Database.joinQuery('nextract_sample', joinSQL, manipulatedCollection, false);
    })
    .then(function(manipulatedCollection) {
      //manipulatedCollection now also contains the age for each matching row. Lets give them
      //all back 10 years of their life.
      return transform.Plugins.Core.Calculator.subtract(manipulatedCollection, 'age', 10, 'age');
    })
    .then(function(manipulatedCollection) {
      //That looks good, lets print the first one as an example...
       transform.Plugins.Core.Logger.debug('Manipulated collection item sample:', manipulatedCollection[0]);

      //Define the match matchCriteria which in this case is a simple primary key match on id. Can
      //be made up of the several fields if needed.
      var matchCriteria = [{ tableColumn: 'id', comparator: '=', collectionField: 'id' }];
      var columnsWeWantToUpdate = ['salary', 'age'];
      return transform.Plugins.Core.Database.updateQuery('nextract_sample', 'employees', manipulatedCollection, columnsWeWantToUpdate, matchCriteria);
    })
    .then(function(manipulatedCollection) {
      //The company has decided to reduce overhead. We need to find all employees making over 60k.
      //For this we filter the collection down and call deleteQuery for each remaining row.
      return transform.Plugins.Core.Filter.greaterThan(manipulatedCollection, 'salary', 59999);
    })
    .then(function(filteredCollection) {
      transform.Plugins.Core.Logger.info('The filtered collection now contains', filteredCollection.length, 'records');

      //We need to remove all employees making over 60k.
      var matchCriteria = [{ tableColumn: 'id', comparator: '=', collectionField: 'id' }];
      return transform.Plugins.Core.Database.deleteQuery('nextract_sample', 'employees', filteredCollection, matchCriteria);
    })
    .then(function() {
      transform.Plugins.Core.Logger.info('transform job complete!');
    })
    .catch(function(err) {
      transform.Plugins.Core.Logger.error('transform process failed:', err);
    });
*/

console.log('Must rework batch insert process to work with the streaming model');

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Example: Demonstrates multiple query types plus calculator and filter features. Review
 * the employees table before and after running these to see the results.
 */
const path = require('path'), objectStream = require('object-stream'), Nextract = require(path.resolve(__dirname, '../../nextract')), exampleUtils = require(path.resolve(__dirname, '../helpers/exampleUtils'));
/* MAIN */
const transform = new Nextract('queries');
console.log('Starting transform... ', new Date());
transform.loadPlugins('Core', ['Database', 'Filter', 'Calculator', 'Utils', 'Logger'])
    .then(() => {
    //Lets generate a bunch of new employees and create a collection (i.e.) an array of objects
    const collectionsToInsert = [];
    for (let i = 0; i < 50; i++) {
        collectionsToInsert[collectionsToInsert.length] = {
            'first_name': exampleUtils.getRandomString(),
            'last_name': exampleUtils.getRandomString(),
            'age': exampleUtils.getRandomInt(18, 65),
            'salary': exampleUtils.getRandomInt(20000, 80000)
        };
    }
    //Create a stream from our dummy data array
    return objectStream.fromArray(collectionsToInsert);
})
    .then((dummyDataStream) => {
    return new Promise((resolve) => {
        //Step 1: Insert are generated records
        dummyDataStream.pipe(transform.Plugins.Core.Database.insertQuery('nextract_sample', 'employees'));
        //Pause for a moment to let the streaming insert of dummy data to finish
        setTimeout(() => {
            resolve();
        }, 3000);
    });
})
    .then(() => {
    const step4JoinSql = 'select age from employees where id = ?';
    const step4JoinFilterColumns = ['id'];
    //Define the step 6 & 8 match matchCriteria which in this case is a simple primary key match on id. Can
    //be made up of the several fields if needed.
    const step6And8MatchCriteria = [{ tableColumn: 'id', comparator: '=', collectionField: 'id' }];
    //Step 2: Now that we've loaded some new employees into the employees table, lets find them all and give them all a raise.
    //Get a readStream to start the job with
    transform.Plugins.Core.Database.selectQuery('nextract_sample', 'select id, first_name, last_name, salary from employees')
        //Step 3: Transform operations are most often performed on the entire collection. Here we are taking the salary of each collection item
        //and raising it by 1000.  We could choose to store this new value in new collection properity or simply overwrite the existing one.
        //Here we'll just overwrite the existing one.
        .pipe(transform.Plugins.Core.Calculator.add('salary', 1000, 'salary'))
        //Step 4: Elements flowing through the stream now have the updated salary. I left age out of selectQuery
        //call so that I could demonstrate a collection join.  Lets find the age of all these employees.
        .pipe(transform.Plugins.Core.Database.joinQuery('nextract_sample', step4JoinSql, step4JoinFilterColumns, ['age'], false))
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
        .pipe(transform.Plugins.Core.Database.deleteQuery('nextract_sample', 'employees', step6And8MatchCriteria))
        .on('data', (resultingData) => {
        //NOTE: This listener must exist, even if it does nothing. Otherwise, the end event is not fired.
    })
        .on('finish', () => {
        transform.Plugins.Core.Logger.info('Transform finished!', new Date());
    })
        .on('end', () => {
        transform.Plugins.Core.Logger.info('Transform ended!');
        process.exit();
    });
})
    .catch((err) => {
    transform.Plugins.Core.Logger.error('Transform failed: ', err);
    process.exit();
});

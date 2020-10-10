"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Example: CSV input and sort...
 */
const path = require('path'), Nextract = require(path.resolve(__dirname, '../nextract'));
const sampleEmployeesInputFilePath = path.resolve(process.cwd(), 'data/employees.csv'), sampleEmployeesOutputFilePath = path.resolve(process.cwd(), 'data/employees_output.csv');
const transform = new Nextract('csvAndSort');
transform.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger'])
    .then(() => {
    return new Promise((resolve) => {
        //STEP 1: Read data in from a CSV file
        transform.Plugins.Core.Input.readCsvFile(sampleEmployeesInputFilePath)
            //STEP 2: Pass data in to be sorted (1 element is pushed back and it is the expected input
            //for a new stream read call to sortOut)
            .pipe(transform.Plugins.Core.Sort.sortIn(['last_name'], ['asc']))
            .on('data', (sortInDbInfo) => {
            if (sortInDbInfo !== undefined) {
                resolve(sortInDbInfo);
            }
        });
    });
})
    .then((sortInDbInfo) => {
    //We want the call to toCsvString to take the keys from the first record and use them to make a csv header
    const outputCsvConfig = {
        header: true,
        columns: {
            first_name: 'first_name',
            last_name: 'last_name',
            age: 'age',
            salary: 'salary'
        }
    };
    transform.Plugins.Core.Sort.sortOut(sortInDbInfo)
        //STEP 3: We want to write the sorted data back out to a new CSV file so first we use
        //toCsvString to stringify the stream.
        .pipe(transform.Plugins.Core.Output.toCsvString(outputCsvConfig, sampleEmployeesOutputFilePath))
        //STEP 4: Write out the new file
        .pipe(transform.Plugins.Core.Output.toFile(sampleEmployeesOutputFilePath))
        .on('finish', () => {
        transform.Plugins.Core.Logger.info('Transform finished!');
        transform.Plugins.Core.Logger.info(sampleEmployeesOutputFilePath, 'has been written');
    })
        .on('end', () => {
        transform.Plugins.Core.Logger.info('Transform ended!');
        process.exit();
    });
})
    .catch((err) => {
    transform.Plugins.Core.Logger.error('Transform failed: ', err);
});

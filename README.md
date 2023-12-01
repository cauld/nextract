# Overview
Nextract is a [Extract Transform Load (ETL)](https://en.wikipedia.org/wiki/Extract,_transform,_load) platform build on top of [Node.js streams](https://nodejs.org/api/stream.html). Popular Java based ETL tools like [Pentaho Data Integration](http://www.pentaho.com/product/data-integration) and [Talend Data Integration](https://www.talend.com/products/data-integration/) are rigid to work with, difficult to extend, and output code that developers aren't meant to mess with.  Nextract aims to change that with a more modern approach. Nextract is scriptable, easy to write, simple to follow, and leverages standard npm packages to extend its functionality. With Nextract and the JavaScript skills you already have, you too can be an ETL developer.

## Features

 - Support for the following databases; Postgres, MSSQL, MySQL, MariaDB, SQLite3, and Oracle.
 - Accepts input from CSV, JSON and/or database queries.
 - Supported output types include CSV, JSON and/or database tables.
 - Core plugins with many common ETL operations included (i.e.) sorting, i/o, querying, filtering, basic mathematical operations, etc.
 - Easily extendable 3rd party plugin system (plugins are just node modules).

## Performance
 Nextract is currently limited by the resources of a single machine. Therefore, it works best with small to medium size data sets at this point... a few hundred thousand records (more if your transforms don't require buffering/blocking steps like sorts). There is a good benchmarking script included with the examples (build/examples/database/advanced/queryAndSortMultiDbBenchmark.js). This example selects 200,000 records from MySQL, filters them, sorts them, performs some basic calculations, and batch inserts them into a Postgres database to demonstrate working with multiple databases in a single transform. On a MacBook Air (1.7GHz Intel Core i7) running macOS (10.12+) with 8GB 1600 MHz DDR3 memory this runs in roughly 3 minutes. Smaller sets are much faster.

## Setup

#### OS X & Linux

 1. Install Node (preferably 8.1+)
 2. Open a terminal and run **./setup.sh**.  This will install all the necessary npm packages and generate a default configuration file.
 3. Open the default configuration file (config/default.json) and customize by adding your database connection params, setting a log file path, overriding system default, etc. The default config contains 2 sample databases entries that can be used to run the included example transformations (assuming you setup the tables and adjust the connection settings for your local env).

## Additional Setup

 - Oracle is supported, but not enabled by default as it requires some additional system setup. Follow the directions outlined [here](https://www.npmjs.com/package/oracle) to install and configure the oracle npm package.

## Examples

 1. There are a good many example transforms included in the `build/examples` directory. Run any of them by getting into the same directory as the script you want to run and executing `node ./{SCRIPT_NAME}.js`.
 2. Examples in the top level `build/examples` directory use sample data files included with the project (csv, json, etc). These can be run without setting up any databases.
 3. Database examples are in the `build/examples/database` directory. All of the examples in this directory use MySQL. You just need to create a MySQL database and create an `employees` table using the `build/examples/data/employees.mysql.sql` file.
 4. The benchmark example mentioned above in the "Performance" section is found under the `build/examples/database/advanced` directory. This example uses both MySQL and Postgres. To get a lot of sample data in the database for testing it uses a sqldump of page data from Wikipedia that contains about 42m+ records. You'll need to download the file from here - https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-page.sql.gz. Import this into MySQL and it will create the `page` table for you. The example selects from this MySQL table and outputs into a Postgres database to simulate working with multiple databases. So you'll need to setup Postgres in addition to MySQL. You just need create one empty table in Postgres named `page` using the provided `build/examples/data/page.postgres.sql` file.

## Example Transform

```javascript
/**
 * Example: JSON input and sort...
 */

const path     = require('path'),
      Nextract = require(path.resolve(__dirname, '../nextract'));

//Define our input and output files
const sampleEmployeesInputFilePath = path.resolve(process.cwd(), 'data/employees.json'),
      sampleEmployeesOutputFilePath = path.resolve(process.cwd(), 'data/employees_output.json');

//Tranforms always start with instance of the Nextract base class and a tranform name
const transform = new Nextract('jsonAndSort');

//We load the core plugin and then an additional plugins our transform requires
transform.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger'])
  .then(() => {
    return new Promise((resolve) => {
      //STEP 1: Read data in from a JSON file (we specify the object path we care about)
      transform.Plugins.Core.Input.readJsonFile(sampleEmployeesInputFilePath, 'data.employees.*')
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
    transform.Plugins.Core.Sort.sortOut(sortInDbInfo)
      //STEP 3: We want to write the sorted data back out to a new JSON file so first we use
      //toJsonString to stringify the stream.
      .pipe(transform.Plugins.Core.Output.toJsonString(true))
      //STEP 4: Write out the new file
      .pipe(transform.Plugins.Core.Output.toFile(sampleEmployeesOutputFilePath))
      .on('finish', () => {
        //Just logging some information back to the console
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
```

## Development
 The source code for this project lives under the `src` directory. Grunt is used to build the project and generate API docs when the source is updated. When developing, simply run `grunt watch` from the project's root directory. As the source is updated Grunt will automatically generate new builds in the `build` directory.

## API Docs
API docs are generated from source code comments using [YUI Docs](https://yui.github.io/yuidoc/). To view the docs simply open `build/apidocs/index.html` in your browser of choice.

## What's missing?

 - All CRUD database operations should be wrapped in transactions
 - More core plugins (e.g.) Mail
 - Performance enhancements for larger data sets
 - Tests for all core plugins

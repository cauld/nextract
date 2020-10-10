
export {}; // Workaround for global declarations

/**
 * Example: Parameterized query
 */

const path     = require('path'),
      Nextract = require(path.resolve(__dirname, '../../nextract'));

const transform = new Nextract();

transform.loadPlugins('Core', ['Database', 'Logger'])
  .then((dbDataStream) => {
    const sql = 'select first_name, last_name from employees where age >= ?';
    const sqlReplacements = [ 30 ];

    transform.Plugins.Core.Database.selectQuery('nextract_sample', sql, sqlReplacements)
      .on('data', (resultingData) => {
        //We aren't doing any additional transforms so no pipes are needed.
        //We'll just dump out the data when it arrives.
        if (resultingData !== undefined) {
          console.log(resultingData);
        }
      })
      .on('end', () => {
        transform.Plugins.Core.Logger.info('Transform finished!');
        process.exit();
      });
  })
  .catch((err) => {
    transform.Plugins.Core.Logger.error('Transform failed:', err);
    process.exit();
  });

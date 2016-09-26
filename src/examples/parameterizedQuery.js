/**
 * Example: Parameterized query
 */

var path       = require('path'),
    Nextract   = require(path.resolve(__dirname, '../nextract'));

var transform = new Nextract();

transform.loadPlugins('Core', ['Database', 'Logger'])
  .then(function(dbDataStream) {
    var sql = 'select first_name, last_name from employees where age >= ?';
    var sqlReplacements = [ 30 ];

    transform.Plugins.Core.Database.selectQuery('nextract_sample', sql, sqlReplacements)
      .on('data', function(resultingData) {
        //We aren't doing any additional transforms so no pipes are needed.
        //We'll just dump out the data when it arrives.
        if (resultingData !== undefined) {
          console.log(resultingData);
        }
      })
      .on('end', function() {
        transform.Plugins.Core.Logger.info('Transform finished!');
        process.exit();
      });
  })
  .catch(function(err) {
    transform.Plugins.Core.Logger.error('Transform failed:', err);
    process.exit();
  });

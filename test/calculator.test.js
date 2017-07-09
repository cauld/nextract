var mocha    = require('mocha'),
    should   = require('should'),
    path     = require('path'),
    stubData = require(path.resolve(__dirname, './stubData')),
    Nextract = require(path.resolve(__dirname, '../build/nextract'));

var transform = new Nextract('calculatorTest');
var readStream = null;

describe('Calculator', function() {
  beforeEach(function(done) {
    transform.loadPlugins('Core', ['Calculator'])
      .then(function() {
        readStream = stubData.getSampleEmployeeDataStream(1);
        done();
      })
      .catch(function(err) {
        console.log('Test loadPlugins error:', err);
      });
  });

  describe('Performing Calculator.add', function() {
    it('age should end up being original age + 10', function(done) {
      transform.loadPlugins('Core', ['Calculator'])
        .then(function() {
          var ageBeforeOperation;

          readStream
            .on('data', function(employee) {
              if (employee !== undefined) {
                ageBeforeOperation = employee.age;
              }
            })
            .pipe(transform.Plugins.Core.Calculator.add('age', 10, 'age'))
            .on('data', function(employee) {
              if (employee !== undefined) {
                employee.age.should.be.a.Number().and.be.exactly(ageBeforeOperation + 10);
              }
            })
            .on('end', function() {
              done();
            });
        });
    });
  });

  describe('Performing Calculator.subtract', function() {
    it('age should end up being original age - 10', function(done) {
      transform.loadPlugins('Core', ['Calculator'])
        .then(function() {
          var ageBeforeOperation;

          readStream
            .on('data', function(employee) {
              if (employee !== undefined) {
                ageBeforeOperation = employee.age;
              }
            })
            .pipe(transform.Plugins.Core.Calculator.subtract('age', 10, 'age'))
            .on('data', function(employee) {
              if (employee !== undefined) {
                employee.age.should.be.a.Number().and.be.exactly(ageBeforeOperation - 10);
              }
            })
            .on('end', function() {
              done();
            });
        });
    });
  });

  describe('Performing Calculator.multiply', function() {
    it('age should end up being original age * 10', function(done) {
      transform.loadPlugins('Core', ['Calculator'])
        .then(function() {
          var ageBeforeOperation;

          readStream
            .on('data', function(employee) {
              if (employee !== undefined) {
                ageBeforeOperation = employee.age;
              }
            })
            .pipe(transform.Plugins.Core.Calculator.multiply('age', 10, 'age'))
            .on('data', function(employee) {
              if (employee !== undefined) {
                employee.age.should.be.a.Number().and.be.exactly(ageBeforeOperation * 10);
              }
            })
            .on('end', function() {
              done();
            });
        });
    });
  });

  describe('Performing Calculator.divide', function() {
    it('age should end up being original age / 10', function(done) {
      transform.loadPlugins('Core', ['Calculator'])
        .then(function() {
          var ageBeforeOperation;

          readStream
            .on('data', function(employee) {
              if (employee !== undefined) {
                ageBeforeOperation = employee.age;
              }
            })
            .pipe(transform.Plugins.Core.Calculator.divide('age', 10, 'age'))
            .on('data', function(employee) {
              if (employee !== undefined) {
                employee.age.should.be.a.Number().and.be.exactly(ageBeforeOperation / 10);
              }
            })
            .on('end', function() {
              done();
            });
        });
    });
  });

  describe('Performing Calculator.concat', function() {
    it('full_name should end up being "first_name last_name"', function(done) {
      transform.loadPlugins('Core', ['Calculator'])
        .then(function() {
          readStream
            .pipe(transform.Plugins.Core.Calculator.concat(['first_name', 'last_name'], ' ', 'full_name'))
            .on('data', function(employee) {
              if (employee !== undefined) {
                var valToTestFor = employee.first_name + ' ' + employee.last_name;
                employee.should.have.property('full_name').and.be.exactly(valToTestFor);
              }
            })
            .on('end', function() {
              done();
            });
        });
    });
  });
});

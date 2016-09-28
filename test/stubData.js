var _ = require('lodash'),
    objectStream = require('object-stream');

var sampleEmployeeData = [
  { "id": 1, "first_name": "john", "last_name": "smith", "age": 30, "salary": 40000 },
  { "id": 2, "first_name": "ozgur", "last_name": "sen", "age": 35, "salary": 50000 },
  { "id": 3, "first_name": "chad", "last_name": "auld", "age": 35, "salary": 50000 }
];

module.exports = {

  getSampleEmployeeDataStream: function(numberOfRecordsToReturn) {
    var stubData;

    if (!_.isUndefined(numberOfRecordsToReturn)) {
      stubData = sampleEmployeeData.slice(0, parseInt(numberOfRecordsToReturn, 10));
    }

    return objectStream.fromArray(stubData);
  }

};

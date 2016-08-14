/**
 * Custom module used to import data
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var jsonfile = require('jsonfile'),
    fs       = require('fs'),
    csv      = require('csv');

function readJsonFile(filePath) {
  return new Promise(function (resolve, reject) {
    jsonfile.readFile(filePath, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function readTextFile(filePath) {
  return new Promise(function (resolve, reject) {
    //Read the contents of the file into memory
    fs.readFile(filePath, function (err, fileData) {
      if (err) {
        reject(err);
      }

      //Convert buffer to string
      var input = fileData.toString();

      csv.parse(input, { delimiter: ',', columns: true }, function(err, output) {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  });
}

module.exports = {

  //TODO: Implement...
  /*
    JSON
    CSV
    Excel
  */

  //TODO: might choke on a large file... buffer/stream perhaps
  readFile: function(fileType, filePath) {
    if (fileType === 'json') {
      return readJsonFile(filePath);
    } else {
      return readTextFile(filePath);
    }
  }

};

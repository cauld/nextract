'use strict';

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isNull2 = require('lodash/isNull');

var _isNull3 = _interopRequireDefault(_isNull2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _throttle = require('throttle');

var _throttle2 = _interopRequireDefault(_throttle);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

var sortPlugin = new _pluginBase2.default('Sort', 'Core');

/* Plugin external interface */
module.exports = {

  /**
   * Sorts a stream of objects. Be sure to call Plugins.Core.Sort.sortOut in the pipe()
   * immediately after the call to sortIn.
   *
   * @method sortIn
   * @for Nextract.Plugins.Core.Sort
   *
   * @example
   *     someReadableStream.pipe(transform.Core.Sort.sortIn(['user', 'age'], ['asc', 'desc'])).pipe(transform.Core.Sort.sortOut())
   *
   * @param {Array} propertiesToSortBy An array of properties to sort by
   * @param {Array} ordersToSortBy An array of sort directions. The number of array elements must match
   * the number of elements provided in propertiesToSortBy. The index of each element will be matched against
   * the index of propertiesToSortBy. Valid values are "asc" & "desc".
   *
   * @return {stream.Transform} Retuns 1 stream object with information expected as input to sortOut
   */
  sortIn: function sortIn(propertiesToSortBy, ordersToSortBy) {
    if (!(0, _isArray3.default)(propertiesToSortBy) || !(0, _isArray3.default)(ordersToSortBy) || propertiesToSortBy.length !== ordersToSortBy.length) {
      throw new Error('The sortBy params propertiesToSortBy & ordersToSortBy must both be an array of equal length!');
    }

    /*
    We are about to do a pretty unique kind of stream manipulation. It isn't really a
    map, filter, or reduce.  More like a map/reduce with side effects. In a nutshell to scale
    grouping operations like sort, group by, sum, etc we'll take advatange of Sqlite. We create
    a temporary table based on the first stream row, insert a row for each stream row and return
    for each row as part of the stream like a filter === false.  Then in the final flush call
    we'll query out the data and push it into the stream kinda like a reduce in that the output
    is one operation, but that operation ends up being the result of the final query which can
    have multiple rows.
    */
    var dbInstance = sortPlugin.getInternalDbInstance();
    var elementsToInsert = [];
    var tableName = null;
    var stream = null;

    //TODO: revisit with dynamic sizing, sqlite has a max sql vars/size limit that causes INSERTS
    //to fail if we bump this too high.
    var batchSize = 100;

    var q = _async2.default.queue(function (element, callback) {
      if ((0, _isNull3.default)(tableName)) {
        //Add to the batch
        elementsToInsert[elementsToInsert.length] = element;

        //This is the first element, we need a temp table before inserts can begin...
        sortPlugin.createTemporaryTableForStream(element).then(function (temporaryTableName) {
          tableName = temporaryTableName;

          //Once the initial table is added we can bump the concurrency (https://github.com/caolan/async/issues/747),
          //doing before would lead to multiple tables being created.
          q.pause();
          q.concurrency = 5;
          q.resume();

          callback();
        }).catch(function (err) {
          sortPlugin.ETL.logger.error('Invalid createTemporaryTableForStream request:', err);
        });
      } else {
        //Add to the batch
        elementsToInsert[elementsToInsert.length] = element;

        //Insert the batch if we've reached the limit
        if (elementsToInsert.length === batchSize) {
          dbInstance.batchInsert(tableName, elementsToInsert, batchSize).then(function () {
            elementsToInsert = []; //reset
            //Calling callback in sync fashion gets lost in the shuffle when many many items are queued up.
            //Calling through setImmediate solves this.
            setImmediate(function () {
              callback();
            });
          }).catch(function (err) {
            sortPlugin.ETL.logger.error('Invalid INSERT request:', err);
          });
        } else {
          //Batch limit not reached, just continue...
          setImmediate(function () {
            callback();
          });
        }
      }
    }, 1);

    function processStreamInput(element, encoding, callback) {
      stream = this;

      if (!(0, _isUndefined3.default)(element)) {
        q.push(element, function () {
          callback(null, null);
        });
      } else {
        callback(null, null);
      }
    }

    //Takes the place of q.drain (more appropriate when using through2)
    function flushInsert(callback) {
      var sortInDbInfo = {
        tableName: tableName,
        propertiesToSortBy: propertiesToSortBy,
        ordersToSortBy: ordersToSortBy
      };

      if (elementsToInsert.length > 0) {
        dbInstance.batchInsert(tableName, elementsToInsert, elementsToInsert.length).then(function () {
          elementsToInsert = null; //Done, clear it
          stream.push(sortInDbInfo);
          callback();
        }).catch(function (err) {
          sortPlugin.ETL.logger.error('Invalid INSERT request:', err);
        });
      } else {
        //Nothing left, just continue...
        stream.push(sortInDbInfo);
        callback();
      }
    }

    return sortPlugin.buildStreamTransform(processStreamInput, flushInsert, 'standard');
  },

  /**
   * Outputs a stream of sorted objects. Must be used in first pipe()
   * immediately after the call to Plugins.Core.Sort.sortIn to pickup the sorted output.
   *
   * @method sortOut
   * @for Nextract.Plugins.Core.Sort
   *
   * @example
   *     someReadableStream.pipe(transform.Core.Sort.sortIn(['user', 'age'], ['asc', 'desc'])).pipe(transform.Core.Sort.sortOut())
   *
   * @param {Array} propertiesToSortBy An array of properties to sort by
   * @param {Array} ordersToSortBy An array of sort directions. The number of array elements must match
   * the number of elements provided in propertiesToSortBy. The index of each element will be matched against
   * the index of propertiesToSortBy. Valid values are "asc" & "desc".
   *
   * @return {stream.Transform} Sorted read/write stream transform to use in conjuction with pipe()
   */
  sortOut: function sortOut(sortInDbInfo) {
    var ordering = void 0,
        sortedSelectSql = void 0;

    sortedSelectSql = 'SELECT * FROM ' + sortInDbInfo.tableName + ' ORDER BY';
    ordering = [];
    for (var i = 0; i < sortInDbInfo.propertiesToSortBy.length; i++) {
      ordering[ordering.length] = ' ' + sortInDbInfo.propertiesToSortBy[i] + ' ' + sortInDbInfo.ordersToSortBy[i];
    }

    sortedSelectSql += ordering.join(',');

    /*
    Throttle expects a regular stream (not an object stream) that can only deal with Strings and Buffers.
    We need to create another object stream that appropriately transforms our data, for example, by emitting
    a JSON-stringified version of our object.
    Refs:
    1) https://nodesource.com/blog/understanding-object-streams/
    2) https://github.com/TooTallNate/node-throttle
    */
    var jsonStreamDelimiter = '_||_'; //string that won't be present in the actual data
    var jsonStream = function jsonStream(element) {
      return JSON.stringify(element) + jsonStreamDelimiter;
    };

    var nextElementString = ''; //Placeholder for chunks as we process them back into objects
    var toObjectStream = function toObjectStream(chunk, encoding, callback) {
      var _this = this;

      if (!(0, _isUndefined3.default)(chunk) && !(0, _isNull3.default)(chunk)) {
        (function () {
          var oStream = _this;

          nextElementString += chunk.toString('utf8');
          var splitChunkStrings = nextElementString.split(jsonStreamDelimiter); //each JSON object ends with }
          nextElementString = ''; //reset

          splitChunkStrings.map(function (cStr) {
            if (!(0, _isEmpty3.default)(cStr) && cStr.charAt(cStr.length - 1) === '}') {
              var nextElement = JSON.parse(cStr);
              oStream.push(nextElement);
            } else {
              nextElementString += cStr;
            }
          });
        })();
      }

      callback();
    };

    //Create a "Throttle" instance that reads at a set bps
    var throttle = new _throttle2.default({ bps: 750000 });
    var stream = sortPlugin.runInternalSelectQueryForStream(sortedSelectSql, []);
    return stream.pipe(sortPlugin.buildStreamTransform(jsonStream, null, 'map')).pipe(throttle).pipe(sortPlugin.buildStreamTransform(toObjectStream, null, 'standard')).on('end', function () {
      //Sorting done, we have what we need... drop the temp table
      sortPlugin.dropTemporaryTableForStream(sortInDbInfo.tableName).then(function () {}).catch(function (err) {
        sortPlugin.ETL.logger.error('Invalid DROP TABLE request:', err);
      });
    });
  }

};

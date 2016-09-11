'use strict';

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
var sortPlugin = new _pluginBase2.default('Sort', 'Core');

//We can't guarantee the order of JavaScript properties and its possible each collection
//item contains more properties than the ones being requested as part of the insert. So
//we must handpick them out in the right order here.
/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

function getInOrderValues(streamElement, columnsToInsert) {
  var inOrderValues = [];
  columnsToInsert.forEach(function (col) {
    inOrderValues[inOrderValues.length] = streamElement[col];
  });

  return inOrderValues;
}

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
    function processStreamInput(element, encoding, callback) {
      var batchAmount = 100; //This number is still experimental... 100 seems to work best right now.
      var that = this;

      if ((0, _isUndefined3.default)(element)) {
        //We have reach the end of the input stream and we most likely have some left over elements below the batch threshold.
        //So insert the final batch now...
        if (this.elementValuesToInsert.length > 0) {
          //We can't use the original batch statement becauase the value count is different
          var lastInsertSql = sortPlugin.getBoilerplateStreamBulkInsertStatement(this.dbInfo.tmpTableName, this.dbInfo.sampleElement, this.elementValuesToInsert.length);

          sortPlugin.runInternalQuery(lastInsertSql, (0, _flatten3.default)(this.elementValuesToInsert), false, function () {
            that.elementValuesToInsert = null; //done, clear it
            return callback(null, that.dbInfo); //sortOut expects this 1 element
          });
        } else {
          this.push(this.dbInfo); //sortOut expects this 1 element
          return callback();
        }
      } else {
        //We need to setup the INSERT sql when encountering the first element in the stream
        if ((0, _isUndefined3.default)(this.dbInfo)) {
          this.elementValuesToInsert = [];

          this.dbInfo = {
            propertiesToSortBy: propertiesToSortBy,
            ordersToSortBy: ordersToSortBy,
            sortInputCount: 1,
            columns: (0, _keys3.default)(element),
            sampleElement: element
          };

          sortPlugin.createTemporaryTableForStream(element, function (temporaryTableName) {
            that.dbInfo.tmpTableName = temporaryTableName;
            that.dbInfo.insertSql = sortPlugin.getBoilerplateStreamBulkInsertStatement(temporaryTableName, element, batchAmount);

            that.elementValuesToInsert[that.elementValuesToInsert.length] = getInOrderValues(element, that.dbInfo.columns);
            return callback(null, null); //We have to push something to keep the stream moving...
          });
        } else {
          this.dbInfo.sortInputCount++;

          //Add this element to the batch
          this.elementValuesToInsert[this.elementValuesToInsert.length] = getInOrderValues(element, this.dbInfo.columns);

          //Do the batch INSERT if we have hit the batch limit
          if (this.elementValuesToInsert.length === batchAmount) {
            var sqlReplacements = (0, _flatten3.default)(this.elementValuesToInsert);
            this.elementValuesToInsert = []; //reset for next batch

            sortPlugin.runInternalQuery(this.dbInfo.insertSql, sqlReplacements, false, function () {
              return callback(null, null);
            });
          } else {
            //That one was added to the batch, lets move to the next.
            return callback(null, null);
          }
        }
      }
    }

    return sortPlugin.buildStreamTransform(processStreamInput, null, 'standard');
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
  sortOut: function sortOut() {
    function processStreamInput(element, encoding, callback) {
      var sortInDbInfo = element;

      var that = this,
          selectSql,
          ordering;

      selectSql = 'SELECT * FROM ' + sortInDbInfo.tmpTableName + ' ORDER BY';
      ordering = [];
      for (var i = 0; i < sortInDbInfo.propertiesToSortBy.length; i++) {
        ordering[ordering.length] = ' ' + sortInDbInfo.propertiesToSortBy[i] + ' ' + sortInDbInfo.ordersToSortBy[i];
      }

      selectSql += ordering.join(',');

      //Grab the sorted rows
      sortPlugin.runInternalQuery(selectSql, [], true, function (err, sortedRows) {
        //Sorting done, we have what we need... drop the temp table
        sortPlugin.dropTemporaryTableForStream(sortInDbInfo.tmpTableName, function (err) {
          if (err) sortPlugin.ETL.logger.error('Invalid DROP TABLE request:', err);

          sortedRows.forEach(function (r) {
            that.push(r);
          });
          that.push(null);
          //that.end();

          return callback(null, null);
        });
      });
    }

    return sortPlugin.buildStreamTransform(processStreamInput, null, 'standard');
  }

};

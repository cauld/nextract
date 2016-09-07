'use strict';

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _pluginBase = require('../../pluginBase');

var _pluginBase2 = _interopRequireDefault(_pluginBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Instantiate the plugin
var sortPlugin = new _pluginBase2.default('Sort', 'Core');

/* Plugin external interface */
/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

module.exports = {

  /**
   * Sorts a stream of objects
   *
   * @method sortBy
   * @for Nextract.Plugins.Core.Sort
   *
   * @example
   *     someReadableStream.pipe(Plugins.Core.Sort.sortBy(['user', 'age'], ['asc', 'desc']))
   *
   * @param {Array} propertiesToSortBy An array of properties to sort by
   * @param {Array} ordersToSortBy An array of sort directions. The number of array elements must match
   * the number of elements provided in propertiesToSortBy. The index of each element will be matched against
   * the index of propertiesToSortBy. Valid values are "asc" & "desc".
   *
   * @return {stream.Transform} Sorted read/write stream transform to use in conjuction with pipe()
   */
  sortBy: function sortBy(propertiesToSortBy, ordersToSortBy) {
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
      if ((0, _isUndefined3.default)(element)) return callback();

      var that = this,
          sqlReplacements = (0, _values3.default)(element);

      //We need to setup the INSERT sql when encountering the first element in the stream
      if ((0, _isUndefined3.default)(this.dbInfo)) {
        this.dbInfo = {};

        sortPlugin.createTemporaryTableForStream(element, function (temporaryTableName) {
          that.dbInfo.tmpTableName = temporaryTableName;
          that.dbInfo.insertSql = sortPlugin.getBoilerplateStreamInsertStatement(that.dbInfo.tmpTableName, element);

          sortPlugin.runInternalQuery(that.dbInfo.insertSql, sqlReplacements, false, function () {
            return callback();
          });
        });
      } else {
        sortPlugin.runInternalQuery(this.dbInfo.insertSql, sqlReplacements, false, function () {
          return callback();
        });
      }
    }

    function streamFlush(callback) {
      var that = this,
          selectSql,
          ordering;

      selectSql = 'SELECT * FROM ' + this.dbInfo.tmpTableName + ' ORDER BY';
      ordering = [];
      for (var i = 0; i < propertiesToSortBy.length; i++) {
        ordering[ordering.length] = ' ' + propertiesToSortBy[i] + ' ' + ordersToSortBy[i];
      }

      selectSql += ordering.join(',');

      console.log("selectSql", selectSql);

      //Grab the sorted rows
      sortPlugin.runInternalQuery(selectSql, [], true, function (err, sortedRows) {
        that.push(sortedRows);

        //Sorting done, we have what we need... drop the temp table
        sortPlugin.dropTemporaryTableForStream(that.dbInfo.tmpTableName, function (err) {
          if (err) sortPlugin.ETL.logger.error('Invalid DROP TABLE request:', err);

          return callback();
        });
      });
    }

    return sortPlugin.buildStreamTransform(processStreamInput, streamFlush, 'standard');
  }

};

/**
 * Mixes in methods used to sort data
 *
 * @class Nextract.Plugins.Core.Sort
 */

import async from 'async';
//import Throttle from 'throttle';
//import through2 from 'through2';
import { isEmpty, isNull, isUndefined, isArray } from 'lodash/fp';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
let sortPlugin = new pluginBase('Sort', 'Core');

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
  sortIn: function(propertiesToSortBy, ordersToSortBy) {
    if (!isArray(propertiesToSortBy) || !isArray(ordersToSortBy) || propertiesToSortBy.length !== ordersToSortBy.length) {
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
    let dbInstance = sortPlugin.getInternalDbInstance();
    let elementsToInsert: any[] = [];
    let tableName: any;
    let stream: any = null;

    //TODO: revisit with dynamic sizing, sqlite has a max sql vars/size limit that causes INSERTS
    //to fail if we bump this too high.
    let batchSize = 100;

     let q = async.queue(function(element, callback) {
      if (isNull(tableName)) {
        //Add to the batch
        elementsToInsert[elementsToInsert.length] = element;

        //This is the first element, we need a temp table before inserts can begin...
        sortPlugin.createTemporaryTableForStream(element)
          .then((temporaryTableName) => {
            tableName = temporaryTableName;

            //Once the initial table is added we can bump the concurrency (https://github.com/caolan/async/issues/747),
            //doing before would lead to multiple tables being created.
            q.pause();
            q.concurrency = 5;
            q.resume();

            callback();
          })
          .catch(function(err) {
            sortPlugin.ETL.logger.error('Invalid createTemporaryTableForStream request:', err);
          });
      } else {
        //Add to the batch
        elementsToInsert[elementsToInsert.length] = element;

        //Insert the batch if we've reached the limit
        if (elementsToInsert.length === batchSize) {
          dbInstance.batchInsert(tableName, elementsToInsert, batchSize)
            .then(function() {
              elementsToInsert = []; //reset
              //Calling callback in sync fashion gets lost in the shuffle when many many items are queued up.
              //Calling through setImmediate solves this.
              setImmediate(function() { callback(); });
            })
            .catch(function(err) {
              sortPlugin.ETL.logger.error('Invalid INSERT request:', err);
            });
        } else {
          //Batch limit not reached, just continue...
          setImmediate(function() { callback(); });
        }
      }
    }, 1);

    const processStreamInput = (element, encoding, callback) => {
      stream = this;

      if (!isUndefined(element)) {
        q.push(element, function() {
          callback(null, null);
        });
      } else {
        callback(null, null);
      }
    }

    //Takes the place of q.drain (more appropriate when using through2)
    function flushInsert(callback) {
      let sortInDbInfo = {
        tableName,
        propertiesToSortBy,
        ordersToSortBy
      };

      if (elementsToInsert.length > 0) {
        dbInstance.batchInsert(tableName, elementsToInsert, elementsToInsert.length)
          .then(function() {
            elementsToInsert = []; //Done, clear it
            stream.push(sortInDbInfo);
            callback();
          })
          .catch(function(err) {
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
  sortOut: function(sortInDbInfo) {
    let ordering,
        sortedSelectSql;

    sortedSelectSql = 'SELECT * FROM ' + sortInDbInfo.tableName + ' ORDER BY';
    ordering = [];
    for (let i=0; i<sortInDbInfo.propertiesToSortBy.length; i++) {
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
    let jsonStreamDelimiter = '_||_'; //string that won't be present in the actual data
    let jsonStream = function(element) {
      return JSON.stringify(element) + jsonStreamDelimiter;
    };

    let nextElementString = ''; //Placeholder for chunks as we process them back into objects
    let toObjectStream = (chunk, encoding, callback) => {
      if (!isUndefined(chunk) && !isNull(chunk)) {
        let oStream = this;

        nextElementString += chunk.toString('utf8');
        let splitChunkStrings = nextElementString.split(jsonStreamDelimiter); //each JSON object ends with }
        nextElementString = ''; //reset

        splitChunkStrings.map(function(cStr) {
          if (!isEmpty(cStr) && cStr.charAt(cStr.length - 1) === '}') {
            let nextElement = JSON.parse(cStr);
            oStream.push(nextElement);
          } else {
            nextElementString += cStr;
          }
        });
      }

      callback();
    };

    //Create a "Throttle" instance that reads at a set bps
    //let throttle = new Throttle({ bps: 750000 });
    let stream = sortPlugin.runInternalSelectQueryForStream(sortedSelectSql, []);
    return stream
            .pipe(sortPlugin.buildStreamTransform(jsonStream, null, 'map'))
            //.pipe(throttle)
            .pipe(sortPlugin.buildStreamTransform(toObjectStream, null, 'standard'))
            .on('end', function() {
              //Sorting done, we have what we need... drop the temp table
              sortPlugin.dropTemporaryTableForStream(sortInDbInfo.tableName)
                .then(function() {})
                .catch(function(err) {
                  sortPlugin.ETL.logger.error('Invalid DROP TABLE request:', err);
                });
            });
  }

};

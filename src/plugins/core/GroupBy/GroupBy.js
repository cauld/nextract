/**
 * Mixes in methods used to perform grouping operations on data
 *
 * @class Nextract.Plugins.Core.GroupBy
 */

import _ from 'lodash';
import { isUndefined, isNumber } from 'lodash/fp';
import pluginBase from '../../pluginBase';

//Instantiate the plugin
let groupByPlugin = new pluginBase('GroupBy', 'Core');

module.exports = {

  //TODO: Implement
  maxBy: function() {

  },

  //TODO: Implement
  minBy: function() {

  },

  //TODO: Implement
  meanBy: function() {

  },

  /**
   * Computes the sum of a single properties for all elements in a stream
   *
   * @method sumBy
   * @for Nextract.Plugins.Core.GroupBy
   *
   * @example
   *     someTransform.Plugins.Core.GroupBy.sumBy('salary');
   *
   * @param {String} prop The property to sum
   *
   * @return {Stream} The resulting stream is a single value
   */
  sumBy: function(propertyToSum) {
    function combine (element, encoding, callback) {
      if (!_.isNumber(element[propertyToSum])) {
        throw new Error("sumBy failed! Non numeric value in element:", element);
      }

      if (_.isUndefined(this.total)) {
        this.total = element[propertyToSum];
        return callback();
      }
      this.total += element[propertyToSum];
      return callback();
    }

    function flush (callback) {
      this.push(this.total);
      return callback();
    }

    //Would be nice to use through2-reduce, but it assumes the stream is just a stream of numbers.
    return groupByPlugin.buildStreamTransform(combine, flush, 'standard');
  },

  //TODO: Implement, ref - https://www.npmjs.com/package/unique-stream
  uniqBy: function() {

  }

};

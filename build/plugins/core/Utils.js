"use strict";

/**
 * Mixes in methods used to work with a database
 *
 * @class Nextract.Plugins.Core.Utils
 */

module.exports = {

  /**
   * Utility which runs all passed Promises and returns only once all have been fufilled
   *
   * @method runAll
   * @example
   *     ETL.Plugins.Core.Utils.runAll([p1, p2]);
   *
   * @param {Array} promisesToRunAn array of Promises
   * @return {Promise} Promise resolved with an array of Promise resolutions
   */
  runAll: function runAll(promisesToRun) {
    return Promise.all(promisesToRun);
  }

};

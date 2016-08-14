/**
 * Nextract Plugin Base
 */

//Require for ES6 support, but no reference needed
require('babel-polyfill');

var config = require('./config/default'),
    logger = require('./core/Logger');

module.exports = {

  config: config,
  logger: logger

};

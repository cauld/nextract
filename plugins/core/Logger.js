/**
 * Winston logging config
 * References:
 * - https://github.com/winstonjs/winston
 * - http://stackoverflow.com/a/23330037
 * - http://stackoverflow.com/a/25233851
 */
var logger = require('winston');

logger.setLevels({ debug: 0, info: 1, silly: 2, warn: 3, error: 4 });
logger.addColors({ debug: 'green', info: 'cyan', silly: 'magenta', warn: 'yellow', error: 'red' });

//Customize the console output
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'error', colorize: true });

//By default, only the Console transport is set on the default logger and
//we want to make sure important issues land in a log file
//TODO: make this log file endpoint customizable....
logger.add(logger.transports.File, { filename: '/var/log/nextract.log', level: 'error' });

//Available log() functions are defined here:
//http://sailsjs.org/#!/documentation/concepts/Logging/sails.log.html
module.exports = {

  info: logger.info,
  warn: logger.warn,
  debug: logger.debug,
  error: logger.error

};

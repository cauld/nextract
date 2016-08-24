/**
 * Winston logging config
 * References:
 * - https://github.com/winstonjs/winston
 * - http://stackoverflow.com/a/23330037
 * - http://stackoverflow.com/a/25233851
 */

import config from '../../config/default';
import * as logger from 'winston';

logger.setLevels({ debug: 0, info: 1, silly: 2, warn: 3, error: 4 });
logger.addColors({ debug: 'green', info: 'cyan', silly: 'magenta', warn: 'yellow', error: 'red' });

//Customize the console output
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'error', colorize: true });

//Only the Console transport is set on the default logger by default
//We want to capture errors in a log file as well.
logger.add(logger.transports.File, { filename: config.logging.logFilePath, level: 'error' });

module.exports = {

  info: logger.info,
  warn: logger.warn,
  debug: logger.debug,
  error: logger.error

};

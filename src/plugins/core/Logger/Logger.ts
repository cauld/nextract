/**
 * Winston logging config
 * References:
 * - https://github.com/winstonjs/winston
 * - http://stackoverflow.com/a/23330037
 * - http://stackoverflow.com/a/25233851
 */

//import * as config from '../../../../config/default.json';
import config from 'config';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.File({ filename: config.logging.logFilePath, level: 'error' }),
    new winston.transports.File({ filename: config.logging.combinedLogFilePath })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default {
  info: logger.info,
  warn: logger.warn,
  debug: logger.debug,
  error: logger.error
};

'use strict';

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _winston = require('winston');

var logger = _interopRequireWildcard(_winston);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Winston logging config
 * References:
 * - https://github.com/winstonjs/winston
 * - http://stackoverflow.com/a/23330037
 * - http://stackoverflow.com/a/25233851
 */

logger.setLevels({ debug: 0, info: 1, silly: 2, warn: 3, error: 4 });
logger.addColors({ debug: 'green', info: 'cyan', silly: 'magenta', warn: 'yellow', error: 'red' });

//Customize the console output
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'error', colorize: true });

//Only the Console transport is set on the default logger by default
//We want to capture errors in a log file as well.
logger.add(logger.transports.File, { filename: _default2.default.logging.logFilePath, level: 'error' });

module.exports = {

  info: logger.info,
  warn: logger.warn,
  debug: logger.debug,
  error: logger.error

};

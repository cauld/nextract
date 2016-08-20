'use strict';

var _default = require('./config/default');

var _default2 = _interopRequireDefault(_default);

var _Logger = require('./core/Logger');

var logger = _interopRequireWildcard(_Logger);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Nextract Plugin Utils
 */

module.exports = {

  config: _default2.default,
  logger: logger

};

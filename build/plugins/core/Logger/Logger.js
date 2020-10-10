"use strict";
/**
 * Winston logging config
 * References:
 * - https://github.com/winstonjs/winston
 * - http://stackoverflow.com/a/23330037
 * - http://stackoverflow.com/a/25233851
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//import * as config from '../../../../config/default.json';
const config_1 = __importDefault(require("config"));
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston_1.default.transports.File({ filename: config_1.default.logging.logFilePath, level: 'error' }),
        new winston_1.default.transports.File({ filename: config_1.default.logging.combinedLogFilePath })
    ]
});
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple()
    }));
}
exports.default = {
    info: logger.info,
    warn: logger.warn,
    debug: logger.debug,
    error: logger.error
};

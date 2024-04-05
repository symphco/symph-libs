"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const tslib_1 = require("tslib");
const util_1 = require("util");
const logging_winston_1 = require("@google-cloud/logging-winston");
const daysjs = require("dayjs");
const localizedFormat = require("dayjs/plugin/localizedFormat");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");
const winston = require("winston");
const local_storage_1 = require("../config/local-storage");
daysjs.extend(utc);
daysjs.extend(timezone);
daysjs.extend(localizedFormat);
class LoggerService {
    static generateMiddleware(isProduction) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (isProduction) {
                const logger = LoggerService.createLogger([new logging_winston_1.LoggingWinston()]);
                return logging_winston_1.express.makeMiddleware(logger);
            }
            else {
                const logger = LoggerService.createLogger([
                    new winston.transports.Console(),
                ]);
                return (req, res, next) => {
                    req.log = logger;
                    next();
                };
            }
        });
    }
    constructor(context) {
        this.context = '';
        this.context = context !== null && context !== void 0 ? context : '';
    }
    buildMessage(...messages) {
        const contextLine = this.context ? `[${this.context}] ` : '';
        const lines = messages.map((message) => typeof message === 'object' || Array.isArray(message)
            ? (0, util_1.inspect)(message, {
                depth: 3,
            })
            : message);
        return `${contextLine}${lines.join(' ')}`;
    }
    info(...messages) {
        var _a;
        const centralizedLogger = (_a = local_storage_1.centralizedLoggerStorage.getStore()) !== null && _a !== void 0 ? _a : console;
        centralizedLogger.info(this.buildMessage(...messages));
    }
    debug(...messages) {
        var _a;
        const centralizedLogger = (_a = local_storage_1.centralizedLoggerStorage.getStore()) !== null && _a !== void 0 ? _a : console;
        centralizedLogger.debug(this.buildMessage(...messages));
    }
    error(...messages) {
        var _a;
        const centralizedLogger = (_a = local_storage_1.centralizedLoggerStorage.getStore()) !== null && _a !== void 0 ? _a : console;
        centralizedLogger.error(this.buildMessage(...messages));
    }
}
exports.LoggerService = LoggerService;
LoggerService.createLogger = (transports) => {
    return winston.createLogger({
        transports,
        level: 'debug',
        format: winston.format.combine(LoggerService.appendTimestamp({ tz: 'Asia/Manila' }), winston.format.errors({ stack: true }), winston.format.colorize(), LoggerService.print),
    });
};
LoggerService.appendTimestamp = winston.format((info, options) => {
    if (options.tz) {
        info.timestamp = daysjs().tz(options.tz).format('YYYY-MM-DD HH:mm:ss');
    }
    return info;
});
LoggerService.print = winston.format.printf((info) => {
    const logLines = [`[${info.level}][${info.timestamp}] ${info.message}`];
    if (info.stack) {
        logLines.push(`\n${info.stack}`);
    }
    return logLines.join('');
});
//# sourceMappingURL=logger.service.js.map
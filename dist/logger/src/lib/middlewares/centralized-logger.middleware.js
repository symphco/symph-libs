"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.centralizedLoggerMiddleware = void 0;
const local_storage_1 = require("../config/local-storage");
const centralizedLoggerMiddleware = (req, res, next) => {
    // store injected logger to the local storage for use via logger service
    local_storage_1.centralizedLoggerStorage.run(req.log, () => {
        next();
    });
};
exports.centralizedLoggerMiddleware = centralizedLoggerMiddleware;
//# sourceMappingURL=centralized-logger.middleware.js.map
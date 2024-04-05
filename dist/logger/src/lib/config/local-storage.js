"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.centralizedLoggerStorage = void 0;
const async_hooks_1 = require("async_hooks");
exports.centralizedLoggerStorage = new async_hooks_1.AsyncLocalStorage();
//# sourceMappingURL=local-storage.js.map
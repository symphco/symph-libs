import { AsyncLocalStorage } from 'async_hooks';

export const centralizedLoggerStorage = new AsyncLocalStorage();

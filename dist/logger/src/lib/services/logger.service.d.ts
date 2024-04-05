/// <reference types="node" />
import * as winston from 'winston';
export declare class LoggerService {
    static createLogger: (transports: winston.transport[]) => winston.Logger;
    private static appendTimestamp;
    private static print;
    static generateMiddleware(isProduction: boolean): Promise<(req: import("@google-cloud/logging/build/src/utils/http-request").ServerRequest, res: import("http").ServerResponse<import("http").IncomingMessage>, next: Function) => void>;
    private context;
    constructor(context?: string);
    private buildMessage;
    info(...messages: any[]): void;
    debug(...messages: any[]): void;
    error(...messages: any[]): void;
}

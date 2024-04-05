import { NextFunction, Request, Response } from 'express';
export declare const centralizedLoggerMiddleware: (req: Request & {
    log: any;
}, res: Response, next: NextFunction) => void;

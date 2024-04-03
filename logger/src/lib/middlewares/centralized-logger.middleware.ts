import { NextFunction, Request, Response } from 'express';

import { centralizedLoggerStorage } from '../config/local-storage';

export const centralizedLoggerMiddleware = (
  req: Request & { log: any },
  res: Response,
  next: NextFunction
) => {
  // store injected logger to the local storage for use via logger service
  centralizedLoggerStorage.run(req.log, () => {
    next();
  });
};

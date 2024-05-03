import { NextFunction, Request, Response } from 'express';

import { LoggerService } from '../services/logger.service';

const loggerService = new LoggerService();

export function apiLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const payload = req.body;

  loggerService.info('Payload: ', payload);

  res.on('finish', () => {
    //
  });

  next();
}

import { NextFunction } from 'express';
import * as winston from 'winston';
import { LoggerService } from '../services/logger.service';

export function createDevelopmentLogger() {
  const logger = LoggerService.createLogger([new winston.transports.Console()]);

  return (
    req: Request & { log: winston.Logger },
    res: Response,
    next: NextFunction
  ) => {
    req.log = logger;
    next();
  };
}

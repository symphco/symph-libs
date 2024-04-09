import * as winston from 'winston';
import { LoggerService } from '../services/logger.service';

export function createDevelopmentLogger() {
  const logger = LoggerService.createLogger([new winston.transports.Console()]);

  return (req: any, res: any, next: any) => {
    req.log = logger;
    next();
  };
}

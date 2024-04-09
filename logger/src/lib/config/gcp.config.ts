import { express, LoggingWinston } from '@google-cloud/logging-winston';
import { LoggerService } from '../services/logger.service';

export function createGCPLogger() {
  const logger = LoggerService.createLogger([new LoggingWinston()]);

  return express.makeMiddleware(logger);
}

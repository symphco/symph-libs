import * as daysjs from 'dayjs';
import * as localizedFormat from 'dayjs/plugin/localizedFormat';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { inspect } from 'util';
import * as winston from 'winston';

import { centralizedLoggerStorage } from '../config/local-storage';
import { CloudService } from '../enums/cloud-service.enums';
import { createDevelopmentLogger } from '../utils/development.util';
import { createProductionLogger } from '../utils/production.util';

daysjs.extend(utc);
daysjs.extend(timezone);
daysjs.extend(localizedFormat);

export class LoggerService {
  private static appendTimestamp = winston.format((info: any, options) => {
    if (options.tz) {
      info.timestamp = daysjs().tz(options.tz).format('YYYY-MM-DD HH:mm:ss');
    }
    return info;
  });
  private static print = winston.format.printf((info: any) => {
    const logLines = [`[${info.level}][${info.timestamp}] ${info.message}`];

    if (info.stack) {
      logLines.push(`\n${info.stack}`);
    }

    return logLines.join('');
  });
  private context = '';

  constructor(context?: string) {
    this.context = context ?? '';
  }

  public static createLogger = (transports: winston.transport[]) => {
    return winston.createLogger({
      transports,
      level: 'debug',
      format: winston.format.combine(
        LoggerService.appendTimestamp({ tz: 'Asia/Manila' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        LoggerService.print
      ),
    });
  };

  public static async generateMiddleware(
    isProduction: boolean,
    cloudService: CloudService = CloudService.GCP
  ) {
    if (isProduction) {
      return createProductionLogger(cloudService);
    }

    return createDevelopmentLogger();
  }

  public info(...messages: any[]) {
    const centralizedLogger =
      (centralizedLoggerStorage.getStore() as winston.Logger) ?? console;

    centralizedLogger.info(this.buildMessage(...messages));
  }

  public debug(...messages: any[]) {
    const centralizedLogger =
      (centralizedLoggerStorage.getStore() as winston.Logger) ?? console;

    centralizedLogger.debug(this.buildMessage(...messages));
  }

  public error(...messages: any[]) {
    const centralizedLogger =
      (centralizedLoggerStorage.getStore() as winston.Logger) ?? console;

    centralizedLogger.error(this.buildMessage(...messages));
  }

  private buildMessage(...messages: any[]) {
    const contextLine = this.context ? `[${this.context}] ` : '';
    const lines = messages.map((message) =>
      typeof message === 'object' || Array.isArray(message)
        ? inspect(message, {
            depth: 3,
          })
        : message
    );

    return `${contextLine}${lines.join(' ')}`;
  }
}

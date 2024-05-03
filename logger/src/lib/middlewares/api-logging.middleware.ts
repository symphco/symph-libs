import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

const loggerService = new LoggerService();

function captureResponseBody(res: Response, callback: (body: any) => void) {
  let responseBody: any;
  const { write, end } = res;

  res.write = (...args: any[]) => {
    responseBody = args[0];
    write.apply(res, args);
  };

  res.end = (...args: any[]) => {
    if (args[0]) responseBody = args[0];
    end.apply(res, args);
  };

  res.on('finish', () => callback(responseBody));
}

export function apiLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  loggerService.info('[REQUEST]', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    payload: req.body,
  });

  captureResponseBody(res, (responseBody) => {
    loggerService.info('[RESPONSE]', {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      headers: res.getHeaders(),
      body: responseBody?.toString(),
    });
  });

  res.on('error', (err: any) => {
    loggerService.error('[ERROR]', {
      message: err.message,
      stack: err.stack,
      statusCode: res.statusCode,
    });
  });

  next();
}

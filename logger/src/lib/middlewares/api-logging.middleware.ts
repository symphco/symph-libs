import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

const loggerService = new LoggerService();

function captureResponseBody(res: Response, callback: (body: any) => void) {
  let responseBody: any;
  const { write, end } = res;

  res.write = (...args: any[]) => {
    const [chunk = null, encoding = 'utf8', cb] = args;
    responseBody = chunk;
    return write.apply(res, [chunk, encoding, cb]);
  };

  res.end = (...args: any[]) => {
    const [chunk = null, encoding = 'utf8', cb] = args;
    if (chunk) responseBody = chunk;
    return end.apply(res, [chunk, encoding, cb]);
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

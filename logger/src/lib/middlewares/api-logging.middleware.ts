import { scrub, findSensitiveValues } from '@zapier/secret-scrubber';

import { NextFunction, Request, Response } from 'express';

import { LoggerService } from '../services/logger.service';
import { recurseExtract } from '@zapier/secret-scrubber/lib/utils';

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

export function apiLoggingMiddleware(sensitiveKeys: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    };

    const sensitiveValues = extractSensitiveValues(request, sensitiveKeys);

    logAndScrub({
      sensitiveValues,
      data: request,
      logLabel: '[REQUEST]',
    });

    captureResponseBody(res, (responseBody) => {
      const response = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.getHeaders(),
        body: responseBody
          ? JSON.parse(responseBody.toString() || '{}')
          : undefined,
      };

      const sensitiveValues = extractSensitiveValues(response, sensitiveKeys);

      logAndScrub({
        sensitiveValues,
        data: response,
        logLabel: '[RESPONSE]',
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
  };
}

function logAndScrub(props: LogAndScrubType) {
  const { data, logLabel, sensitiveValues } = props;

  if (sensitiveValues.length > 0) {
    loggerService.info(logLabel, scrub(data, sensitiveValues));
  } else {
    loggerService.info(logLabel, data);
  }
}

function extractSensitiveValues(data: any, sensitiveKeys: string[]) {
  const sensitiveKeysSet = new Set(sensitiveKeys);
  const foundByScrubber = findSensitiveValues(data);
  const foundByRecurseExtract = recurseExtract(data, (key: string) => {
    return sensitiveKeysSet.has(key);
  });

  return [...new Set([...foundByScrubber, ...foundByRecurseExtract])];
}

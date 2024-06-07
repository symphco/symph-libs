typescript
import { scrub, findSensitiveValues } from '@zapier/secret-scrubber';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import { apiLoggingMiddleware } from '../middlewares/apiLoggingMiddleware';

jest.mock('@zapier/secret-scrubber');
jest.mock('../services/logger.service');

let req: Partial<Request>;
let res: Partial<Response>;
let next: NextFunction;
let loggerService: LoggerService;

beforeEach(() => {
  req = {
    method: 'GET',
    path: '/test',
    headers: {},
    body: {},
  };

  res = {
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({}),
    statusCode: 200,
    statusMessage: 'OK',
  };

  next = jest.fn();
  loggerService = new LoggerService();
  jest.spyOn(loggerService, 'info');
  jest.spyOn(loggerService, 'error');
});

describe('apiLoggingMiddleware', () => {
  describe('request logging', () => {
    it('logs request without sensitive values and calls next middleware', () => {
      findSensitiveValues.mockReturnValue([]);
      apiLoggingMiddleware(req as Request, res as Response, next);

      expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
        method: 'GET',
        path: '/test',
        headers: req.headers,
        payload: req.body,
      });
      expect(next).toHaveBeenCalled();
    });

    it('scrubs sensitive values from request and logs it', () => {
      findSensitiveValues.mockReturnValue(['password']);
      req.body = { password: 'secret' };

      apiLoggingMiddleware(req as Request, res as Response, next);

      expect(scrub).toHaveBeenCalledWith({ payload: req.body }, ['password']);
      expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
        method: 'GET',
        path: '/test',
        headers: req.headers,
        payload: { password: '******' },
      });
      expect(next).toHaveBeenCalled();
    });

    it('logs request with empty body gracefully', () => {
      req.body = {};
      apiLoggingMiddleware(req as Request, res as Response, next);

      expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
        method: 'GET',
        path: '/test',
        headers: req.headers,
        payload: req.body,
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('response logging', () => {
    beforeEach(() => {
      findSensitiveValues.mockReturnValue([]);
    });

    it('logs response without sensitive values on finish', () => {
      apiLoggingMiddleware(req as Request, res as Response, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      });
    });

    it('scrubs sensitive values from response body before logging', () => {
      findSensitiveValues.mockReturnValue(['password']);
      res.write('{"password":"responseSecret"}');
      apiLoggingMiddleware(req as Request, res as Response, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(scrub).toHaveBeenCalledWith({ body: '{"password":"responseSecret"}' }, ['password']);
      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: '{"password":"******"}',
      });
    });

    it('logs response with updated headers', () => {
      res.getHeaders.mockReturnValue({ 'content-type': 'application/json' });
      apiLoggingMiddleware(req as Request, res as Response, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: { 'content-type': 'application/json' },
      });
    });

    it('captures and logs complete response body', () => {
      apiLoggingMiddleware(req as Request, res as Response, next);

      res.write('This is a response');
      res.end();

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: 'This is a response',
      });
    });

    it('handles and logs non-JSON response body', () => {
      const responseBody = '<html>response</html>';
      apiLoggingMiddleware(req as Request, res as Response, next);

      res.write(responseBody);
      res.end();

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: responseBody,
      });
    });
  });

  describe('error logging', () => {
    it('logs error if response emits an error', () => {
      const error = new Error('Test Error');
      apiLoggingMiddleware(req as Request, res as Response, next);

      const errorCallback = res.on.mock.calls.find(call => call[0] === 'error')[1];
      errorCallback(error);

      expect(loggerService.error).toHaveBeenCalledWith('[ERROR]', {
        message: error.message,
        stack: error.stack,
        statusCode: res.statusCode,
      });
    });
  });

  describe('utility functions', () => {
    it('defines log request method', () => {
      expect(loggerService.info).toBeDefined();
    });

    it('defines log response method', () => {
      expect(loggerService.info).toBeDefined();
    });

    it('defines log error method', () => {
      expect(loggerService.error).toBeDefined();
    });

    it('defines scrub function from secret-scrubber', () => {
      expect(scrub).toBeDefined();
    });

    it('defines findSensitiveValues function from secret-scrubber', () => {
      expect(findSensitiveValues).toBeDefined();
    });

    it('calls next middleware after logging request and response', () => {
      findSensitiveValues.mockReturnValue([]);
      apiLoggingMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('response body capture', () => {
    let capturedBody: any;

    beforeEach(() => {
      capturedBody = undefined;
    });

    it('captures body written using res.write', () => {
      apiLoggingMiddleware(req as Request, res as Response, next);
      captureResponseBody(res as Response, (body) => {
        capturedBody = body;
      });

      res.write('response chunk');
      res.end();

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe('response chunk');
    });

    it('captures body written using res.end', () => {
      apiLoggingMiddleware(req as Request, res as Response, next);
      captureResponseBody(res as Response, (body) => {
        capturedBody = body;
      });

      res.end('response end');

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe('response end');
    });
  });
});

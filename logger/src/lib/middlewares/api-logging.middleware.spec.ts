typescript
import { scrub, findSensitiveValues } from '@zapier/secret-scrubber';
import { Request, Response, NextFunction } from 'express';
import { apiLoggingMiddleware, captureResponseBody } from './api-logging.middleware';
import { LoggerService } from '../services/logger.service';

jest.mock('@zapier/secret-scrubber');
jest.mock('../services/logger.service');

describe('apiLoggingMiddleware', () => {
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
    jest.spyOn(loggerService, 'info').mockImplementation(() => {});
    jest.spyOn(loggerService, 'error').mockImplementation(() => {});

    findSensitiveValues.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('request logging', () => {
    it('logs request without sensitive values and calls next middleware', () => {
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
    let finishCallback: () => void;

    beforeEach(() => {
      apiLoggingMiddleware(req as Request, res as Response, next);
      finishCallback = res.on.mock.calls[0][1];
    });

    it('logs response without sensitive values on finish', () => {
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      });
    });

    it('scrubs sensitive values from response body before logging', () => {
      findSensitiveValues.mockReturnValue(['password']);
      res.write('{"password":"responseSecret"}');

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

      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: { 'content-type': 'application/json' },
      });
    });

    it('captures and logs complete response body', () => {
      res.write('This is a response');
      res.end();

      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: 'This is a response',
      });
    });

    it('handles and logs non-JSON response body', () => {
      const responseBody = '<html>response</html>';
      res.write(responseBody);
      res.end();

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

  describe('captureResponseBody', () => {
    it('captures body written using res.write', () => {
      let capturedBody: any;
      captureResponseBody(res as Response, (body) => {
        capturedBody = body;
      });

      res.write('response chunk');

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe('response chunk');
    });

    it('captures body written using res.end', () => {
      let capturedBody: any;
      captureResponseBody(res as Response, (body) => {
        capturedBody = body;
      });

      res.end('response end');

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe('response end');
    });
  });
});

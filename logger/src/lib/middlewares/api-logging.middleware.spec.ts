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
    req = { method: 'GET', path: '/test', headers: {}, body: {} };
    res = { write: jest.fn(), end: jest.fn(), on: jest.fn(), getHeaders: jest.fn().mockReturnValue({}), statusCode: 200, statusMessage: 'OK' };
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

    it('scrubs and logs request with sensitive values', () => {
      findSensitiveValues.mockReturnValue(['password']);
      req.body = { password: 'secret' };

      apiLoggingMiddleware(req as Request, res as Response, next);

      expect(scrub).toHaveBeenCalledWith(req.body, ['password']);
      expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
        method: 'GET',
        path: '/test',
        headers: req.headers,
        payload: { password: '******' },
      });
      expect(next).toHaveBeenCalled();
    });

    it('logs request with empty body', () => {
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
    let errorCallback: (err: any) => void;

    beforeEach(() => {
      apiLoggingMiddleware(req as Request, res as Response, next);
      finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')![1];
      errorCallback = res.on.mock.calls.find(call => call[0] === 'error')![1];
    });

    it('logs response without sensitive values on finish', () => {
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      });
    });

    it('logs response with body written using res.write', () => {
      const responseChunk = 'This is a response';
      (res.write as jest.Mock).mockImplementation(() => responseChunk);
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: responseChunk,
      });
    });

    it('handles and logs non-JSON response body', () => {
      const responseBody = '<html>response</html>';
      (res.write as jest.Mock).mockImplementation(() => responseBody);
      finishCallback();

      expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: responseBody,
      });
    });

    it('scrubs and logs response with sensitive values', () => {
      findSensitiveValues.mockReturnValue(['password']);
      const responseSecret = '{"password":"responseSecret"}';
      (res.write as jest.Mock).mockImplementation(() => responseSecret);
      finishCallback();

      expect(scrub).toHaveBeenCalledWith(responseSecret, ['password']);
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
  });

  describe('error logging', () => {
    it('logs error emitted by response', () => {
      const error = new Error('Test Error');
      const mockErrorCallback = res.on.mock.calls.find(call => call[0] === 'error')![1];
      mockErrorCallback(error);

      expect(loggerService.error).toHaveBeenCalledWith('[ERROR]', {
        message: error.message,
        stack: error.stack,
        statusCode: res.statusCode,
      });
    });
  });

  describe('captureResponseBody', () => {
    let capturedBody: any;

    beforeEach(() => {
      capturedBody = undefined;
      captureResponseBody(res as Response, (body) => {
        capturedBody = body;
      });
    });

    it('captures body written using res.write', () => {
      const responseChunk = 'response chunk';
      (res.write as jest.Mock).mockImplementation(() => responseChunk);

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe(responseChunk);
    });

    it('captures body written using res.end', () => {
      const responseEnd = 'response end';
      (res.end as jest.Mock).mockImplementation(() => responseEnd);

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe(responseEnd);
    });

    it('captures latest body when multiple chunks are written', () => {
      const chunk1 = 'first chunk';
      const chunk2 = 'second chunk';

      (res.write as jest.Mock).mockImplementation(() => chunk1);
      (res.write as jest.Mock).mockImplementation(() => chunk2);
      finishCallback();

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe(chunk2);
    });

    it('captures body when using both res.write and res.end', () => {
      const chunk1 = 'first chunk';
      const endChunk = 'end chunk';

      (res.write as jest.Mock).mockImplementation(() => chunk1);
      (res.end as jest.Mock).mockImplementation(() => endChunk);

      expect(capturedBody).toBeDefined();
      expect(capturedBody).toBe(endChunk);
    });
  });
});

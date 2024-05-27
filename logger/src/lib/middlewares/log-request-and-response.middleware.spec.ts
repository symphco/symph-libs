import { logRequestAndResponseMiddleware } from './log-request-and-response.middleware';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import * as scrubber from '@zapier/secret-scrubber';

jest.mock('../services/logger.service');

describe('logRequestAndResponseMiddleware', () => {
  let req: Partial<Request>;
  let next: NextFunction;
  let loggerService: LoggerService;
  let res: any;

  describe('OK', () => {
    beforeEach(() => {
      req = {
        method: 'GET',
        url: '/test',
        headers: {},
        body: {},
      };
      res = {
        statusCode: 200,
        statusMessage: 'OK',
        getHeaders: jest.fn().mockReturnValue({}),
        on: jest.fn(),
        write: {
          apply: jest.fn(),
        },
        end: {
          apply: jest.fn(),
        },
      };
      next = jest.fn();
      loggerService = new LoggerService() as jest.Mocked<LoggerService>;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should log request and response', () => {
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const middleware = logRequestAndResponseMiddleware([], loggerService);

      const { mockOn } = setupMockResponse(res);

      // Call middleware
      middleware(req as Request, res as Response, next);

      // Trigger the 'finish' event
      mockOn.mock.calls[0][1]();

      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', expect.anything());
      expect(logInfoSpy).toHaveBeenCalledWith('[RESPONSE]', expect.anything());
    });

    it('should scrub sensitive values in the response data paylaod', () => {
      const scrubbedResponse = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.getHeaders(),
        body: { accessToken: 'censored:12345' },
      };

      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const middleware = logRequestAndResponseMiddleware([], loggerService);
      const mockScrub = jest
        .spyOn(scrubber, 'scrub')
        .mockReturnValueOnce(scrubbedResponse);

      const { mockOn } = setupMockResponse(res);

      // Call middleware
      middleware(req as Request, res as Response, next);

      res.write('{"accessToken": "secret"}');
      res.end();

      // Trigger the 'finish' event
      mockOn.mock.calls[0][1]();

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[RESPONSE]', scrubbedResponse);
    });

    fit('should scrub sensitive values in the response headers payload', () => {
      const newRes = {
        ...res,
        getHeaders: jest.fn().mockReturnValue({
          'x-api-key': 'secret',
        }),
      };

      const scrubbedResponse = {
        statusCode: newRes.statusCode,
        statusMessage: newRes.statusMessage,
        headers: {
          'x-api-key': 'censored:12345',
        },
      };

      const middleware = logRequestAndResponseMiddleware([], loggerService);
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest
        .spyOn(scrubber, 'scrub')
        .mockReturnValueOnce(scrubbedResponse);

      const { mockOn } = setupMockResponse(newRes);

      middleware(req as Request, newRes as Response, next);

      newRes.write();
      newRes.end();

      // Trigger the 'finish' event
      mockOn.mock.calls[0][1]();

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[RESPONSE]', scrubbedResponse);
    });

    it('should scrub sensitive values in the request payload', () => {
      const scrubbedRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: { password: 'censored:12345' },
      };

      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const middleware = logRequestAndResponseMiddleware([], loggerService);
      const mockScrub = jest
        .spyOn(scrubber, 'scrub')
        .mockReturnValueOnce(scrubbedRequest);

      const newReq = { ...req, body: { password: 'secret' } };

      middleware(newReq as Request, res as Response, next);

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', scrubbedRequest);
    });

    it('should log as is when there are no sensitive data in the request payload', () => {
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest.spyOn(scrubber, 'scrub');
      const middleware = logRequestAndResponseMiddleware([], loggerService);

      const newReq = { ...req, body: { anything: 'anything' } };

      middleware(newReq as Request, res as Response, next);

      expect(mockScrub).not.toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', {
        method: newReq.method,
        url: newReq.url,
        headers: newReq.headers,
        body: newReq.body,
      });
    });

    it('should scrub sensitive values in the request header', () => {
      const scrubbedRequest = {
        method: req.method,
        url: req.url,
        headers: {
          'x-api-key': 'censored:12345',
        },
      };

      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const middleware = logRequestAndResponseMiddleware([], loggerService);
      const mockScrub = jest
        .spyOn(scrubber, 'scrub')
        .mockReturnValueOnce(scrubbedRequest);

      const newReq = { ...req, headers: { 'x-api-key': 'secret' } };

      middleware(newReq as Request, res as Response, next);

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', expect.anything());
    });

    it('should scrub sensitive values when sensitive value keys are explicitly set', () => {
      const scrubbedRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: { code: 'censored:12345' },
      };

      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest
        .spyOn(scrubber, 'scrub')
        .mockReturnValueOnce(scrubbedRequest);

      const middleware = logRequestAndResponseMiddleware(
        ['code'],
        loggerService
      );

      const newReq = { ...req, body: { code: 'secret' } };

      middleware(newReq as Request, res as Response, next);

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', expect.anything());
    });
  });

  describe('ERROR', () => {
    beforeEach(() => {
      req = {
        method: 'GET',
        url: '/test',
        headers: {},
        body: {},
      };
      res = {
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        getHeaders: jest.fn().mockReturnValue({}),
        on: jest.fn(),
        write: {
          apply: jest.fn(),
        },
        end: {
          apply: jest.fn(),
        },
      };
      next = jest.fn();
      loggerService = new LoggerService() as jest.Mocked<LoggerService>;
    });

    it('should log error when res emits an error', () => {
      const mockError = new Error('Test error');
      const logErrorSpy = jest.spyOn(loggerService, 'error');
      const middleware = logRequestAndResponseMiddleware([], loggerService);

      res.on.mockImplementation((event: any, callback: any) => {
        if (event === 'error') {
          callback(mockError);
        }
      });

      // Call middleware
      middleware(req as Request, res as Response, next);

      // Trigger the 'error' event
      res.on.mock.calls[0][1]();

      // Assertions
      expect(logErrorSpy).toHaveBeenCalledWith('[ERROR]', {
        message: mockError.message,
        stack: mockError.stack,
        statusCode: res.statusCode,
      });
    });
  });

  function setupMockResponse(res: any) {
    const mockWrite = jest.fn();
    const mockEnd = jest.fn();
    const mockOn = jest.fn().mockImplementation((event, callback) => {
      if (event === 'finish') {
        callback();
      }
    });

    res.write = mockWrite;
    res.end = mockEnd;
    res.on = mockOn;

    return { mockOn };
  }
});

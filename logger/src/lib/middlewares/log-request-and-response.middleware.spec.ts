import { apiLoggingMiddleware } from './api-logging.middleware';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import * as scrubber from '@zapier/secret-scrubber';

jest.mock('../services/logger.service');

describe('apiLoggingMiddleware', () => {
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
      const middleware = apiLoggingMiddleware([], loggerService);

      const { mockOn } = setupMockResponse();

      // Call middleware
      middleware(req as Request, res as Response, next);

      // Trigger the 'finish' event
      mockOn.mock.calls[0][1]();

      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', expect.anything());
      expect(logInfoSpy).toHaveBeenCalledWith('[RESPONSE]', expect.anything());
    });

    it('should scrub sensitive values in the response data paylaod', () => {
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest.spyOn(scrubber, 'scrub');
      const middleware = apiLoggingMiddleware([], loggerService);

      const { mockOn } = setupMockResponse();

      // Call middleware
      middleware(req as Request, res as Response, next);

      res.write('{"accessToken": "secret"}');
      res.end();

      // Trigger the 'finish' event
      mockOn.mock.calls[0][1]();

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[RESPONSE]', expect.anything());
    });

    it('should scrub sensitive values in the request payload', () => {
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest.spyOn(scrubber, 'scrub');
      const middleware = apiLoggingMiddleware([], loggerService);

      const newReq = { ...req, body: { password: 'secret' } };

      middleware(newReq as Request, res as Response, next);

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', expect.anything());
    });

    it('should log as is when there are no sensitive data in the request payload', () => {
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest.spyOn(scrubber, 'scrub');
      const middleware = apiLoggingMiddleware([], loggerService);

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
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest.spyOn(scrubber, 'scrub');
      const middleware = apiLoggingMiddleware([], loggerService);

      const newReq = { ...req, headers: { 'x-api-key': 'secret' } };

      middleware(newReq as Request, res as Response, next);

      expect(mockScrub).toHaveBeenCalled();
      expect(logInfoSpy).toHaveBeenCalledWith('[REQUEST]', expect.anything());
    });

    it('should scrub sensitive values when sensitive value keys are explicitly set', () => {
      const logInfoSpy = jest.spyOn(loggerService, 'info');
      const mockScrub = jest.spyOn(scrubber, 'scrub');
      const middleware = apiLoggingMiddleware(['code'], loggerService);

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
      const middleware = apiLoggingMiddleware([], loggerService);

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

  function setupMockResponse() {
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

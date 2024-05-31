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
const sensitiveValues = ['password'];

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
});

describe('apiLoggingMiddleware', () => {
  it('should log request without sensitive values', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue([]);
    apiLoggingMiddleware(req as Request, res as Response, next);

    expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
      method: 'GET',
      path: '/test',
      headers: {},
      payload: {},
    });
    expect(next).toHaveBeenCalled();
  });

  it('should log response without sensitive values', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue([]);
    apiLoggingMiddleware(req as Request, res as Response, next);

    const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
    responseBodyCallback();

    expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      body: undefined,
    });
  });

  it('should scrub sensitive values from request', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue(sensitiveValues);
    (scrub as jest.Mock).mockImplementation((obj) => obj);

    req.body = { password: 'secret' };

    apiLoggingMiddleware(req as Request, res as Response, next);

    expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
      method: 'GET',
      path: '/test',
      headers: {},
      payload: { password: 'secret' },
    });
    expect(next).toHaveBeenCalled();
  });

  it('should scrub sensitive values from response', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue(sensitiveValues);
    (scrub as jest.Mock).mockImplementation((obj) => obj);

    apiLoggingMiddleware(req as Request, res as Response, next);

    const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
    res.write('response body');
    responseBodyCallback();

    expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      body: 'response body',
    });
  });

  it('should log error if response has an error', () => {
    const error = new Error('Test Error');

    apiLoggingMiddleware(req as Request, res as Response, next);
    const errorCallback = (res.on as jest.Mock).mock.calls[1][1];
    errorCallback(error);

    expect(loggerService.error).toHaveBeenCalledWith('[ERROR]', {
      message: 'Test Error',
      stack: error.stack,
      statusCode: 200,
    });
  });

  it('should log response with updated headers', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue([]);
    res.getHeaders = jest.fn().mockReturnValue({ 'content-type': 'application/json' });

    apiLoggingMiddleware(req as Request, res as Response, next);
    const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
    responseBodyCallback();

    expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'application/json' },
      body: undefined,
    });
  });

  it('should call next middleware after logging request and response', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue([]);

    apiLoggingMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});

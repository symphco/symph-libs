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
    (findSensitiveValues as jest.Mock).mockReturnValue(['password']);
    req.body = { password: 'secret' };

    apiLoggingMiddleware(req as Request, res as Response, next);

    expect(scrub).toHaveBeenCalledWith({ payload: { password: 'secret' } }, ['password']);
    expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
      method: 'GET',
      path: '/test',
      headers: {},
      payload: { password: '******' },
    });
    expect(next).toHaveBeenCalled();
  });

  it('should scrub sensitive values from response', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue(['password']);

    apiLoggingMiddleware(req as Request, res as Response, next);

    const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
    res.write('{"password":"responseSecret"}');
    res.end();
    
    responseBodyCallback();

    expect(scrub).toHaveBeenCalledWith({ body: '{"password":"responseSecret"}' }, ['password']);
    expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      body: '{"password":"******"}',
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

  it('should capture complete response body', () => {
    apiLoggingMiddleware(req as Request, res as Response, next);

    const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
    res.write('This is a response');
    res.end();

    responseBodyCallback();

    expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      body: 'This is a response',
    });
  });

  it('should handle empty request body gracefully', () => {
    req.body = {};
    apiLoggingMiddleware(req as Request, res as Response, next);

    expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
      method: 'GET',
      path: '/test',
      headers: {},
      payload: {},
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle non-JSON response body', () => {
    const responseBody = '<html>response</html>';
    apiLoggingMiddleware(req as Request, res as Response, next);

    const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
    res.write(responseBody);
    res.end();

    responseBodyCallback();

    expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      body: responseBody,
    });
  });

  it('should define log request method', () => {
    expect(loggerService.info).toBeDefined();
  });

  it('should define log response method', () => {
    expect(loggerService.info).toBeDefined();
  });

  it('should define log error method', () => {
    expect(loggerService.error).toBeDefined();
  });

  it('should define scrub function from secret-scrubber', () => {
    expect(scrub).toBeDefined();
  });

  it('should define findSensitiveValues function from secret-scrubber', () => {
    expect(findSensitiveValues).toBeDefined();
  });

  it('should call next middleware after logging request and response', () => {
    (findSensitiveValues as jest.Mock).mockReturnValue([]);

    apiLoggingMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});



To create unit tests for the given business logic and utility functions in the `apiLoggingMiddleware`, we will use Jest as our testing framework. We will follow the Single Responsibility Principle and clean code principles throughout our test cases.

Here's an example of how the unit test file `apiLoggingMiddleware.spec.ts` can be constructed:

typescript
import { scrub, findSensitiveValues } from '@zapier/secret-scrubber';
import { Request, Response, NextFunction } from 'express';

import { LoggerService } from '../services/logger.service';
import { apiLoggingMiddleware } from '../middlewares/apiLoggingMiddleware';

// Mocking dependencies
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

it('should log request and response without sensitive values', () => {
  (findSensitiveValues as jest.Mock).mockReturnValue([]);

  apiLoggingMiddleware(req as Request, res as Response, next);

  expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
    method: 'GET',
    path: '/test',
    headers: {},
    payload: {},
  });

  expect(next).toHaveBeenCalled();
  
  // Simulate captureResponseBody callback after response finish
  const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
  responseBodyCallback();

  expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {},
    body: undefined,
  });
});

it('should scrub sensitive values from request and response', () => {
  const sensitiveValues = ['password'];
  (findSensitiveValues as jest.Mock).mockReturnValue(sensitiveValues);
  (scrub as jest.Mock).mockImplementation((obj) => obj);

  req.body = { password: 'secret' };
  res.write = jest.fn(() => req.body = 'response body');
  res.end = jest.fn(() => req.body = 'response body');

  apiLoggingMiddleware(req as Request, res as Response, next);

  expect(loggerService.info).toHaveBeenCalledWith('[REQUEST]', {
    method: 'GET',
    path: '/test',
    headers: {},
    payload: { password: 'secret' }, // example, the actual data scrubbed is handled by the implemented scrub mock
  });

  expect(next).toHaveBeenCalled();

  // Simulate captureResponseBody callback after response finish
  const responseBodyCallback = (res.on as jest.Mock).mock.calls[0][1];
  responseBodyCallback();

  expect(loggerService.info).toHaveBeenCalledWith('[RESPONSE]', {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {},
    body: 'response body', // example, the actual data scrubbed is handled by the implemented scrub mock
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


Explanation:

1. **Mocking Dependencies**: Mock the dependencies to isolate the middleware logic from external modules.
2. **Setup**: Initialize `req`, `res`, and `next` before each test to ensure clean, independent test cases.
3. **Test Request and Response Logging**:
   - Check that the middleware logs the request and response when no sensitive values are found.
   - Use the mocked `findSensitiveValues` and `scrub` to simulate the presence of sensitive values and verify scrubbing behavior.
4. **Testing Error Handling**:
   - Verify that the middleware correctly logs errors when the response has an error.
5. **Clean Code**: Follow clean code principles by keeping each test small, focused, and easy to read. Use meaningful names and avoid duplication with `beforeEach`.

This approach ensures we thoroughly test the `apiLoggingMiddleware` function, covering normal operations and edge cases involving sensitive data and errors.
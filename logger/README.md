# logger

## Install

Run `npm i @symphco/logger` to install the library.

## Usage

1. Import `LoggerService` and `centralizedLoggerMiddleware` in your app.module.ts file.
```
import { LoggerService, centralizedLoggerMiddleware } from '@symphco/logger';
```

2. Inside AppModule class, add the following:
```
export class AppModule {
    async configure(consumer: MiddlewareConsumer) {
        consumer.apply(
            await LoggerService.generateMiddleware(process.env.NODE_ENV !== 'development',),
            centralizedLoggerMiddleware
        ).forRoutes('*');
    }
}
```

3. In any service file where Logger will be used, import LoggerService and create an instance of it.
For example:

```
export class RequestService {
  private loggerService: LoggerService;
    constructor() {
      this.loggerService = new LoggerService('Request Service');
    }
}
```
4. You can now use the Logger service’s methods when applicable. For example:

For errors:

`this.loggerService.error('findAll', error.message);`

For info:

`this.loggerService.info('getFindRequestsQuery', params, user);`

### Logging API Request and Response in all Endpoints

To log all API requests and responses, follow these steps:

1. Import the `logRequestAndResponseMiddleware` in your `app.module.ts` file:
```
import { logRequestAndResponseMiddleware } from '@symphco/logger;
```

2. Apply the middleware in the `AppModule` class:
```
    consumer.apply(
      await LoggerService.generateMiddleware(process.env.NODE_ENV !== 'development',),
      centralizedLoggerMiddleware,
      logRequestAndResponseMiddleware([])
  ).forRoutes('*');
``` 

This will log all requests and responses for every API endpoint.

3. By default, sensitive information is scrubbed from the logs. However, if you want to explicitly hide additional information based on custom keys, include those keys when instantiating `logRequestAndResponseMiddleware`. For example, to hide 'passcode' from the logs:

In the app.module.ts file:

```
  consumer.apply(
    await LoggerService.generateMiddleware(process.env.NODE_ENV !== 'development'),
    centralizedLoggerMiddleware,
    logRequestAndResponseMiddleware(['passcode'])
  ).forRoutes('');
```

For example, a logged request to `api/v1/verify` would look like this:

```  
  `api/v1/verify`

  [REQUEST] {
    method: 'POST',
    url: '/',
    headers: {
      ...
    },
    body: {
      passcode: 'censored:263:131f400d91:'
    }
  }
```

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



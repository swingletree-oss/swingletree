import * as winston from "winston";

export class Logger {
  static instance: winston.LoggerInstance = new (winston.Logger)(
    {
      level: "info",
      transports: [ new (winston.transports.Console)() ]
    }
  );
}
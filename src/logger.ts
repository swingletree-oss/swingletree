import * as winston from "winston";

export const LOGGER: winston.LoggerInstance = new (winston.Logger)(
  {
    level: "info",
    transports: [ new (winston.transports.Console)() ]
  }
);

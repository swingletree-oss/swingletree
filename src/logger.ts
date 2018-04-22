import * as winston from "winston";

export const LOGGER: winston.LoggerInstance = new (winston.Logger)(
	{
		level: process.env.LOG_LEVEL || "info",
		transports: [new (winston.transports.Console)()]
	}
);

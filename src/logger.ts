import * as winston from "winston";

export const LOGGER: winston.LoggerInstance = new (winston.Logger)(
	{
		level: (process.env.NODE_ENV == "test") ? "off" : "info",
		transports: [new (winston.transports.Console)()]
	}
);

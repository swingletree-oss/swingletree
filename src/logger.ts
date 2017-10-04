import * as winston from "winston";

export const LOGGER: winston.LoggerInstance = new (winston.Logger)(
	{
		level: (process.env["dev"]) ? "info" : "error",
		transports: [new (winston.transports.Console)()]
	}
);

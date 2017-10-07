import * as winston from "winston";

export const LOGGER: winston.LoggerInstance = new (winston.Logger)(
	{
		level: (process.env["dev"]) ? "info" : "off",
		transports: [new (winston.transports.Console)()]
	}
);

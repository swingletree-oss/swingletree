import * as winston from "winston";

export const LOGGER: winston.LoggerInstance = new (winston.Logger)(
	{
		level: process.env.LOG_LEVEL || "info",
		transports: [new (winston.transports.Console)({
			timestamp: true,
			colorize: process.env.LOG_DISABLE_COLORS != "true"
		})],
	}
);

LOGGER.info("Logger log level set to %s", LOGGER.level.toUpperCase());

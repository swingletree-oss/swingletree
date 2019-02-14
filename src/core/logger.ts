import * as winston from "winston";

export enum LOG_FORMAT {
	JSON = "json",
	LOGSTASH = "logstash"
}

let format = winston.format.combine(
	winston.format.timestamp(),
	winston.format.splat()
);

if (process.env["LOG_FORMAT"] == LOG_FORMAT.JSON) {
	format = winston.format.combine(
		format,
		winston.format.json()
	);
} else if (process.env["LOG_FORMAT"] == LOG_FORMAT.LOGSTASH) {
	format = winston.format.combine(
		format,
		winston.format.logstash()
	);
} else {
	if (process.env["LOG_DISABLE_COLORS"] == "true") {
		format = winston.format.combine(format, winston.format.uncolorize());
	} else {
		format = winston.format.combine(format, winston.format.colorize());
	}

	format = winston.format.combine(format, winston.format.simple(), winston.format.printf(info => {
		return `${info.timestamp} ${info.level}: ${info.message}`;
	}));
}

export const LOGGER: winston.Logger = winston.createLogger(
	{
		level: process.env.LOG_LEVEL || "info",
		format: format,
		transports: [new (winston.transports.Console)()],
	}
);


LOGGER.info("Logger log level set to %s", LOGGER.level.toUpperCase());

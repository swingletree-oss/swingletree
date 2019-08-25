export namespace CoreConfig {
	export enum Github {
		APPID = "github:app:id",
		KEYFILE = "github:app:keyfile",
		BASE = "github:base",
		WEBHOOK_SECRET = "github:secret",
		APP_PUBLIC_PAGE = "github:app:page",
		CLIENT_DEBUG = "github:debug"
	}

	export enum Storage {
		DATABASE = "storage:host",
		PASSWORD = "storage:password"
	}

	export enum Elastic {
		NODE = "elastic:node",
		API_KEY = "elastic:apikey",
		INDEX = "elastic:index"
	}
}

export enum AppConfig {
	PORT = "port"
}
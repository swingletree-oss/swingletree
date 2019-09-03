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
		ENABLED = "elastic:enabled",
		NODE = "elastic:node",
		AUTH = "elastic:auth",
		INDEX = "elastic:index"
	}
}

export enum AppConfig {
	PORT = "port"
}
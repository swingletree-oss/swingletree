import { TemplateEngine } from "../core/template/template-engine";

import container from "../ioc-config";
import { SwingletreeComponent } from "../component";
import { WebServer } from "../core/webserver";
import { ConfigurationService } from "../configuration";
import { ZapConfig } from "./zap-config";
import ZapWebhook from "./zap-webhook";

export class SonarQubePlugin extends SwingletreeComponent.Component {
	private enabled: boolean;

	constructor() {
		super("zap");

		const configService = container.get<ConfigurationService>(ConfigurationService);
		this.enabled = configService.getBoolean(ZapConfig.ENABLED);
	}

	public run(): void {
		const webserver = container.get<WebServer>(WebServer);

		// register services to dependency injection
		container.bind<ZapWebhook>(ZapWebhook).toSelf().inSingletonScope();

		// add webhook endpoint
		webserver.addRouter("/webhook/zap", container.get<ZapWebhook>(ZapWebhook).getRoute());
	}

	public isEnabled(): boolean {
		return this.enabled;
	}
}

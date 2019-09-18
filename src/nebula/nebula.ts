import { TemplateEngine } from "../core/template/template-engine";

import container from "../ioc-config";
import { SwingletreeComponent } from "../component";
import { WebServer } from "../core/webserver";
import { ConfigurationService } from "../configuration";
import { NebulaConfig } from "./config";
import NebulaWebhook from "./webhook";
import NebulaStatusEmitter from "./status-emitter";


export class NebulaPlugin extends SwingletreeComponent.Component {
	private enabled: boolean;

	constructor() {
		super("nebula");

		const configService = container.get<ConfigurationService>(ConfigurationService);
		this.enabled = configService.getBoolean(NebulaConfig.ENABLED);
	}

	public run(): void {
		const webserver = container.get<WebServer>(WebServer);

		// register services to dependency injection
		container.bind<NebulaWebhook>(NebulaWebhook).toSelf().inSingletonScope();
		container.bind<NebulaStatusEmitter>(NebulaStatusEmitter).toSelf().inSingletonScope();

		// initialize Emitters
		container.get<NebulaStatusEmitter>(NebulaStatusEmitter);

		// add webhook endpoint
		webserver.addRouter("/webhook/nebula", container.get<NebulaWebhook>(NebulaWebhook).getRoute());

	}

	public isEnabled(): boolean {
		return this.enabled;
	}
}

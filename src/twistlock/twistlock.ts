import container from "../ioc-config";
import { SwingletreeComponent } from "../component";
import { WebServer } from "../core/webserver";
import { ConfigurationService } from "../configuration";
import { TwistlockConfig } from "./config";
import TwistlockWebhook from "./webhook";
import TwistlockStatusEmitter from "./status-emitter";

export class TwistlockPlugin extends SwingletreeComponent.Component {
	private enabled: boolean;

	constructor() {
		super("twistlock");

		const configService = container.get<ConfigurationService>(ConfigurationService);
		this.enabled = configService.getBoolean(TwistlockConfig.ENABLED);
	}

	public run(): void {
		const webserver = container.get<WebServer>(WebServer);

		// register services to dependency injection
		container.bind<TwistlockWebhook>(TwistlockWebhook).toSelf().inSingletonScope();
		container.bind<TwistlockStatusEmitter>(TwistlockStatusEmitter).toSelf().inSingletonScope();

		// initialize Emitters
		container.get<TwistlockStatusEmitter>(TwistlockStatusEmitter);

		// add webhook endpoint
		webserver.addRouter("/webhook/twistlock", container.get<TwistlockWebhook>(TwistlockWebhook).getRoute());
	}

	public isEnabled(): boolean {
		return this.enabled;
	}
}

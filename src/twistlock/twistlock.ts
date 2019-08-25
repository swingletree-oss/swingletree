import container from "../ioc-config";
import { SwingletreeComponent } from "../component";
import { WebServer } from "../core/webserver";
import { ConfigurationService } from "../configuration";
import { TwistlockConfig } from "./config";
import TwistlockWebhook from "./webhook";
import TwistlockStatusEmitter from "./status-emitter";
import { TwistlockModel } from "./model";
import { TemplateEngine } from "../core/template/template-engine";

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

		// add template filter for severity icons
		container.get<TemplateEngine>(TemplateEngine).addFilter("twistlockFindingSeverity", TwistlockPlugin.twistlockFindingSeverityFilter);
	}

	public static twistlockFindingSeverityFilter(type: TwistlockModel.FindingSeverity | string) {
		if (type == TwistlockModel.FindingSeverity.CRITICAL) return ":bangbang:";
		if (type == TwistlockModel.FindingSeverity.HIGH) return ":exclamation:";
		if (type == TwistlockModel.FindingSeverity.IMPORTANT) return ":red_circle:";
		if (type == TwistlockModel.FindingSeverity.MODERATE) return ":small_red_triangle:";
		if (type == TwistlockModel.FindingSeverity.MEDIUM) return " :small_red_triangle_down:";
		if (type == TwistlockModel.FindingSeverity.LOW) return ":small_orange_diamond:";

		return type;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}
}

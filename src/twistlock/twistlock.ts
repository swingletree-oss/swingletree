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
		container.get<TemplateEngine>(TemplateEngine).addFilter("twistlockVulnSeverity", TwistlockPlugin.twistlockVulnerabilitySeverityFilter);
	}

	public static twistlockVulnerabilitySeverityFilter(type: TwistlockModel.VulnerabilitySeverity | string) {
		if (type == TwistlockModel.VulnerabilitySeverity.CRITICAL) return ":bangbang:";
		if (type == TwistlockModel.VulnerabilitySeverity.HIGH) return ":exclamation:";
		if (type == TwistlockModel.VulnerabilitySeverity.IMPORTANT) return ":red_circle:";
		if (type == TwistlockModel.VulnerabilitySeverity.MODERATE) return ":small_red_triangle:";
		if (type == TwistlockModel.VulnerabilitySeverity.MEDIUM) return " :small_red_triangle_down:";
		if (type == TwistlockModel.VulnerabilitySeverity.LOW) return ":small_orange_diamond:";

		return type;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}
}

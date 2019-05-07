import { TemplateEngine } from "../core/template/template-engine";

import container from "../ioc-config";
import { SwingletreeComponent } from "../component";
import { WebServer } from "../core/webserver";
import { ConfigurationService } from "../configuration";
import { ZapConfig } from "./zap-config";
import ZapWebhook from "./zap-webhook";
import { Zap } from "./zap-model";

export class ZapPlugin extends SwingletreeComponent.Component {
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

		// add template filter for risk code icons
		container.get<TemplateEngine>(TemplateEngine).addFilter("zapRiskcodeIcon", ZapPlugin.zapRiskcodeIconFilter);
	}

	public static zapRiskcodeIconFilter(type: Zap.Riskcode | string) {
		if (type == Zap.Riskcode.HIGH) return "<span title=\"High\"> &#x1F480;&#xFE0F;</span>";
		if (type == Zap.Riskcode.MEDIUM) return "<span title=\"Code Smells\"> &#x26A0;&#xFE0F;</span>";
		if (type == Zap.Riskcode.LOW) return "<span title=\"Vulnerabilities\"> &#x1F53B;&#xFE0F;</span>";
		if (type == Zap.Riskcode.INFORMATIONAL) return "<span title=\"Informational\"> &#x2139;&#xFE0F;</span>";

		return type;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}
}

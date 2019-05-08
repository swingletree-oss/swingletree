import { TemplateEngine } from "../core/template/template-engine";

import container from "../ioc-config";
import { SwingletreeComponent } from "../component";
import { WebServer } from "../core/webserver";
import { ConfigurationService } from "../configuration";
import { ZapConfig } from "./zap-config";
import ZapWebhook from "./zap-webhook";
import { Zap } from "./zap-model";
import ZapStatusEmitter from "./zap-status-emitter";

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
		container.bind<ZapStatusEmitter>(ZapStatusEmitter).toSelf().inSingletonScope();

		// initialize Emitters
		container.get<ZapStatusEmitter>(ZapStatusEmitter);

		// add webhook endpoint
		webserver.addRouter("/webhook/zap", container.get<ZapWebhook>(ZapWebhook).getRoute());

		// add template filter for risk code icons
		container.get<TemplateEngine>(TemplateEngine).addFilter("zapRiskcodeIcon", ZapPlugin.zapRiskcodeIconFilter);
		container.get<TemplateEngine>(TemplateEngine).addFilter("zapConfidence", ZapPlugin.zapConfidenceFilter);
	}

	public static zapRiskcodeIconFilter(type: Zap.Riskcode | string) {
		if (type == Zap.Riskcode.HIGH) return "<span title=\"High\">&#x1F480;&#xFE0F;</span>";
		if (type == Zap.Riskcode.MEDIUM) return "<span title=\"Medium\">&#x26A0;&#xFE0F;</span>";
		if (type == Zap.Riskcode.LOW) return "<span title=\"Low\">&#x1F53B;&#xFE0F;</span>";
		if (type == Zap.Riskcode.INFORMATIONAL) return "<span title=\"Informational\">&#x2139;&#xFE0F;</span>";

		return type;
	}

	public static zapConfidenceFilter(type: Zap.Confidence | string) {
		if (type == Zap.Confidence.FALSE_POSITIVE) return "false positive";
		if (type == Zap.Confidence.HIGH) return "high";
		if (type == Zap.Confidence.MEDIUM) return "medium";
		if (type == Zap.Confidence.LOW) return "low";
		if (type == Zap.Confidence.USER_CONFIRMED) return "user confirmed";

		return type;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}
}

import { Sonar } from "./client/sonar-issue";
import { TemplateEngine } from "../core/template/template-engine";
import * as express from "express";

import container from "../ioc-config";
import SonarWebhook from "./sonar-webhook";
import SonarStatusEmitter from "./sonar-status-emitter";
import SonarClient from "./client/sonar-client";
import { SwingletreeComponent } from "../component";
import { WebServer } from "../core/webserver";
import { ConfigurationService } from "../configuration";
import { SonarConfig } from "./sonar-config";

export class SonarQubePlugin extends SwingletreeComponent.Component {
	private enabled: boolean;

	constructor() {
		super("sonar");

		const configService = container.get<ConfigurationService>(ConfigurationService);
		this.enabled = configService.getBoolean(SonarConfig.ENABLED);
	}

	public run(): void {
		const webserver = container.get<WebServer>(WebServer);

		// register services to dependency injection
		container.bind<SonarWebhook>(SonarWebhook).toSelf().inSingletonScope();
		container.bind<SonarStatusEmitter>(SonarStatusEmitter).toSelf().inSingletonScope();
		container.bind<SonarClient>(SonarClient).toSelf().inSingletonScope();

		// initialize emitter
		container.get<SonarStatusEmitter>(SonarStatusEmitter);

		// add webhook endpoint
		webserver.addRouter("/webhook/sonar", container.get<SonarWebhook>(SonarWebhook).getRoute());

		// add template filter for rule type icons
		container.get<TemplateEngine>(TemplateEngine).addFilter("ruleTypeIcon", SonarQubePlugin.ruleTypeIconFilter);
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	public static ruleTypeIconFilter(type: Sonar.model.RuleType | string) {
		if (type == Sonar.model.RuleType.BUG) return "<span title=\"Bugs\"> &#x1F41B;</span>";
		if (type == Sonar.model.RuleType.CODE_SMELL) return "<span title=\"Code Smells\"> &#x2623;&#xFE0F;</span>";
		if (type == Sonar.model.RuleType.VULNERABILITY) return "<span title=\"Vulnerabilities\"> &#x1F480;</span>";
		if (type == Sonar.model.RuleType.SECURITY_HOTSPOT) return "<span title=\"Security Hotspot\"> &#x1F4A3;</span>";

		return type;
	}
}

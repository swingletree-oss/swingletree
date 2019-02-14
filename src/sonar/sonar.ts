import { RuleType } from "./model/sonar-issue";
import { TemplateEngine } from "../core/template/template-engine";
import * as express from "express";

import container from "../ioc-config";
import SonarWebhook from "./sonar-webhook";
import SonarStatusEmitter from "./sonar-status-emitter";
import { SonarClient } from "./client/sonar-client";
import { SwingletreeComponent } from "../component";

export class SonarQubePlugin extends SwingletreeComponent {

	private app: express.Application;

	constructor(app: express.Application) {
		super();
		this.app = app;
	}

	public start(): void {
		// register services to dependency injection
		container.bind<SonarWebhook>(SonarWebhook).toSelf().inSingletonScope();
		container.bind<SonarStatusEmitter>(SonarStatusEmitter).toSelf().inSingletonScope();
		container.bind<SonarClient>(SonarClient).toSelf().inSingletonScope();

		// initialize emitter
		container.get<SonarStatusEmitter>(SonarStatusEmitter);

		// add webhook endpoint
		this.app.use("/webhook/sonar", container.get<SonarWebhook>(SonarWebhook).getRoute());

		// add template filter for rule type icons
		container.get<TemplateEngine>(TemplateEngine).addFilter("ruleTypeIcon", SonarQubePlugin.ruleTypeIconFilter);
	}

	public static ruleTypeIconFilter(type: RuleType | string) {
		if (type == RuleType.BUG) return "<span title=\"Bugs\"> &#x1F41B;</span>";
		if (type == RuleType.CODE_SMELL) return "<span title=\"Code Smells\"> &#x2623;&#xFE0F;</span>";
		if (type == RuleType.VULNERABILITY) return "<span title=\"Vulnerabilities\"> &#x1F480;</span>";
		if (type == RuleType.SECURITY_HOTSPOT) return "<span title=\"Security Hotspot\"> &#x1F4A3;</span>";

		return type;
	}
}
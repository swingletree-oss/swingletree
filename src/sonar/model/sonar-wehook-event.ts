import { SonarQualityGate } from "./sonar-quality-gate";
"use strict";

export class SonarWebhookEvent {
	analysedAt: Date;
	project: Object;
	properties: Properties;

	qualityGate: SonarQualityGate;

	dashboardUrl: string;
	serverUrl: string;
	status: string;
	taskId: string;

	constructor(model: any) {
		this.analysedAt = model.analysedAt;
		this.project = model.project;
		this.properties = new Properties(model.properties);

		this.serverUrl = model.serverUrl;
		this.status = model.status;
		this.taskId = model.taskId;

		this.qualityGate = <SonarQualityGate>model.qualityGate;

		if (model.branch) {
			this.dashboardUrl = model.branch.url;
		} else {
			this.dashboardUrl = (model.project) ? model.project.url : model.serverUrl;
		}
	}
}

class Properties {
	commitId: string;
	repository: string;
	appAction: string;

	constructor(properties: any) {
		this.commitId = properties["sonar.analysis.commitId"];
		this.repository = properties["sonar.analysis.repository"];
	}
}
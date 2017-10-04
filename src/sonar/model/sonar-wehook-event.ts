import { QualityGate } from "./quality-gate";
"use strict";

export class SonarWebhookEvent {
	analysedAt: Date;
	project: Object;
	properties: Properties;

	qualityGate: QualityGate;

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

		this.qualityGate = <QualityGate>model.qualityGate;
	}
}

class Properties {
	branch: string;
	commitId: string;
	repository: string;
	appAction: string;

	constructor(properties: any) {
		this.branch = properties["sonar.analysis.branch"];
		this.commitId = properties["sonar.analysis.commitId"];
		this.repository = properties["sonar.analysis.repository"];
		this.appAction = properties["sonar.analysis.ghPrGate"];
	}
}
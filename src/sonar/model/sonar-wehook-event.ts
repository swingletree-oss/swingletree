import { SonarQualityGate } from "./sonar-quality-gate";
"use strict";

export class SonarWebhookEvent {
	analysedAt: string;
	changedAt: string;
	project: Project;
	properties: Properties;

	qualityGate: SonarQualityGate;

	dashboardUrl: string;
	serverUrl: string;
	status: string;
	taskId: string;

	branch: Branch;

	statusSuccess: boolean;

	constructor(model: any = {}) {
		Object.assign(this, model);

		this.properties = new Properties(model.properties);
		this.qualityGate = new SonarQualityGate(model.qualityGate);
		this.statusSuccess = this.qualityGate.status === "OK";

		if (model.branch) {
			this.dashboardUrl = model.branch.url;
		} else {
			this.dashboardUrl = (model.project) ? model.project.url : model.serverUrl;
		}
	}
}

interface Project {
	key: string;
	name: string;
	url?: string;
}

interface Branch {
	name: string;
	type?: string;
	isMain?: boolean;
	url?: string;
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
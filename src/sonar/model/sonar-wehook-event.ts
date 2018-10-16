export enum QualityGateStatus {
	OK = "OK",
	NO_VALUE = "NO_VALUE",
	ERROR = "ERROR"
}

export enum ConditionOperator {
	GREATER_THAN = "GREATER_THAN",
	LESS_THAN = "LESS_THAN",
	EQUALS = "EQUALS",
	NOT_EQUALS = "NOT_EQUALS"
}

export interface Condition {
	errorThreshold: string;
	metric: string;
	onLeakPeriod: boolean;
	operator: ConditionOperator | string;
	status: QualityGateStatus | string;
	value: string;
}

export interface SonarQualityGate {
	conditions: Condition[];
	name: string;
	status: string;
}

export interface SonarWebhookEvent {
	analysedAt: string;
	changedAt: string;
	project: Project;
	branch?: Branch;

	properties: any;

	qualityGate: SonarQualityGate;

	serverUrl: string;
	status: string;
	taskId: string;
}

interface Project {
	key: string;
	name: string;
	url?: string;
}

interface Branch {
	name: string;
	type?: "LONG" | "SHORT" | string;
	isMain?: boolean;
	url?: string;
}


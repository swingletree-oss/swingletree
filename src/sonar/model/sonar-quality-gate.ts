"use strict";

export enum QualityGateStatus {
	OK = "OK"
}

export class SonarQualityGate {
	conditions: Condition[];
	name: string;
	status: string;

	constructor(data = {}) {
		Object.assign(this, data);
	}

	public getFailureCount() {
		let failures = 0;

		if (this.conditions && this.conditions.length > 0) {
			this.conditions.forEach((value: Condition) => {
				if (value.status != QualityGateStatus.OK) {
					failures++;
				}
			});
		}

		return failures;
	}
}

class Condition {
	errorThreshold: string;
	metric: string;
	onLeakPeriod: boolean;
	operator: string;
	status: string;
	value: string;
}
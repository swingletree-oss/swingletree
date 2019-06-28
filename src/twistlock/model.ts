export namespace TwistlockModel {

	export interface Report {
		results: Result[];
	}

	interface Result {
		id: string;
		distro: string;
		complianceDistribution: SeverityCount;
		vulnerabilities?: Vulnerability[];
		vulnerabilityDistribution: SeverityCount;
	}

	interface SeverityCount {
		critical: number;
		high: number;
		medium: number;
		low: number;
		total: number;
	}

	interface Vulnerability {
		id: string;
		status: string;
		cvss: number;
		vector: string;
		description: string;
		severity: string;
		packageName: string;
		packageVersion: string;
		link: string;
		riskFactors: any;
	}

	export interface Template {
		report: Report;
	}
}

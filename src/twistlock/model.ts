import { RepositoryConfigPluginItem } from "../core/event/event-model";

export namespace TwistlockModel {

	export namespace util {
		export class FindingReport {
			public readonly complianceIssues: TwistlockModel.Compliance[];
			public readonly ignoredComplianceIssues: TwistlockModel.Compliance[];
			public readonly vulnerabilityIssues: TwistlockModel.Vulnerability[];
			public readonly ignoredVulnerabilityIssues: TwistlockModel.Vulnerability[];

			public readonly complianceCounts: Map<FindingSeverity, number>;
			public readonly vulnerabilityCounts: Map<FindingSeverity, number>;

			public readonly exceptions: Map<string, string>;

			constructor(report: Report, vulnSeverity = FindingSeverity.LOW, minCvss = 0, complianceSeverity = FindingSeverity.LOW, exceptions = new Map<string, string>()) {
				this.complianceIssues = [];
				this.ignoredComplianceIssues = [];
				this.vulnerabilityIssues = [];
				this.ignoredVulnerabilityIssues = [];

				this.complianceCounts = new Map<FindingSeverity, number>();
				this.vulnerabilityCounts = new Map<FindingSeverity, number>();

				this.exceptions = exceptions;

				if (report.results && report.results.length > 0) {
					report.results.forEach((result) => {
						if (result.vulnerabilities) {
							result.vulnerabilities.forEach((vuln) => {
								if (exceptions.has(vuln.id)) {
									this.ignoredVulnerabilityIssues.push(vuln);
								} else {
									if (vuln.cvss >= minCvss || TwistlockModel.SeverityUtil.isEqualOrHigher(vuln.severity, vulnSeverity)) {
										this.addVulnerabilityIssue(vuln);
									} else {
										this.ignoredVulnerabilityIssues.push(vuln);
									}
								}
							});
						}

						if (result.compliances) {
							result.compliances.forEach((comp) => {
								if (TwistlockModel.SeverityUtil.isEqualOrHigher(comp.severity, complianceSeverity)) {
									this.addComplianceIssue(comp);
								} else {
									this.ignoredComplianceIssues.push(comp);
								}
							});
						}
					});
				}
			}

			private addComplianceIssue(issue: Compliance) {
				this.complianceIssues.push(issue);
				if (this.complianceCounts.has(issue.severity)) {
					this.complianceCounts.set(issue.severity, this.complianceCounts.get(issue.severity) + 1);
				} else {
					this.complianceCounts.set(issue.severity, 1);
				}
			}

			private addVulnerabilityIssue(issue: Vulnerability) {
				this.vulnerabilityIssues.push(issue);
				if (this.vulnerabilityCounts.has(issue.severity)) {
					this.vulnerabilityCounts.set(issue.severity, this.vulnerabilityCounts.get(issue.severity) + 1);
				} else {
					this.vulnerabilityCounts.set(issue.severity, 1);
				}
			}

			public issuesCount(): number {
				return this.complianceIssues.length + this.vulnerabilityIssues.length;
			}

			public ignoredCount(): number {
				return this.ignoredComplianceIssues.length + this.ignoredVulnerabilityIssues.length;
			}
		}
	}

	export enum FindingSeverity {
		CRITICAL = "critical",
		HIGH = "high",
		MEDIUM = "medium",
		LOW = "low",
		TOTAL = "total"
	}

	export interface RepoConfig extends RepositoryConfigPluginItem {
		thresholdVulnerability: FindingSeverity;
		thresholdCvss: number;
		thresholdCompliance: FindingSeverity;

		exceptions: Map<string, string>;
	}

	export class DefaultRepoConfig implements RepoConfig {
		enabled: boolean;
		thresholdVulnerability: FindingSeverity;
		thresholdCvss: number;
		thresholdCompliance: FindingSeverity;

		exceptions: Map<string, string>;

		constructor(repoConfig?: RepoConfig) {
			if (repoConfig) {
				this.enabled = repoConfig.enabled;
				this.thresholdCompliance = repoConfig.thresholdCompliance;
				this.thresholdCvss = repoConfig.thresholdCvss;
				this.thresholdVulnerability = repoConfig.thresholdVulnerability;
				this.exceptions = repoConfig.exceptions || new Map<string, string>();
			} else {
				this.enabled = false;
				this.exceptions = new Map<string, string>();
				this.thresholdCompliance = FindingSeverity.LOW;
				this.thresholdCvss = 0;
				this.thresholdVulnerability = FindingSeverity.LOW;
			}
		}
	}


	export class SeverityUtil {
		static severityScore(severity: FindingSeverity): number {
			switch (severity) {
				case TwistlockModel.FindingSeverity.CRITICAL: return 4;
				case TwistlockModel.FindingSeverity.HIGH: return 3;
				case TwistlockModel.FindingSeverity.MEDIUM: return 2;
				case TwistlockModel.FindingSeverity.LOW: return 1;
			}
		}

		static isEqualOrHigher(compare: FindingSeverity, withItem: FindingSeverity): boolean {
			return this.severityScore(compare) >= this.severityScore(withItem);
		}

	}

	export interface Report {
		results: Result[];
	}

	interface Result {
		id: string;
		distro: string;
		compliances?: Compliance[];
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

	export interface Compliance {
		title: string;
		severity: FindingSeverity;
	}

	export interface Vulnerability {
		id: string;
		status: string;
		cvss: number;
		vector: string;
		description: string;
		severity: FindingSeverity;
		packageName: string;
		packageVersion: string;
		link: string;
		riskFactors: any;
	}

	export interface Template {
		report: Report;
		issues: TwistlockModel.util.FindingReport;
	}
}

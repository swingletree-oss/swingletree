import { RepositoryConfigPluginItem } from "../core/event/event-model";
import { Swingletree } from "../core/model";

export namespace TwistlockModel {

	export namespace util {
		export class FindingReport {
			public readonly complianceIssues: TwistlockModel.Compliance[];
			public readonly ignoredComplianceIssues: TwistlockModel.Compliance[];
			public readonly vulnerabilityIssues: TwistlockModel.Vulnerability[];
			public readonly ignoredVulnerabilityIssues: TwistlockModel.Vulnerability[];

			public readonly complianceCounts: Map<TwistlockSeverity, number>;
			public readonly vulnerabilityCounts: Map<string, number>;

			public readonly whitelist: Map<string, string>;

			constructor(report: Report, minCvss = 0, complianceSeverity = TwistlockSeverity.LOW, whitelist = new Map<string, string>()) {
				this.complianceIssues = [];
				this.ignoredComplianceIssues = [];
				this.vulnerabilityIssues = [];
				this.ignoredVulnerabilityIssues = [];

				this.complianceCounts = new Map<TwistlockSeverity, number>();
				this.vulnerabilityCounts = new Map<string, number>();

				this.whitelist = whitelist;

				if (report.results && report.results.length > 0) {
					report.results.forEach((result) => {
						if (result.vulnerabilities) {
							result.vulnerabilities.forEach((vuln) => {
								if (whitelist.has(vuln.id)) {
									this.ignoredVulnerabilityIssues.push(vuln);
								} else {
									if (vuln.cvss >= minCvss) {
										this.vulnerabilityIssues.push(vuln);
										this.updateCounterMap(this.vulnerabilityCounts, vuln.severity);
									} else {
										this.ignoredVulnerabilityIssues.push(vuln);
									}
								}
							});
						}

						if (result.compliances) {
							result.compliances.forEach((comp) => {
								if (TwistlockModel.SeverityUtil.isComplianceEqualOrHigher(comp.severity, complianceSeverity)) {
									this.complianceIssues.push(comp);
									this.updateCounterMap(this.complianceCounts, comp.severity);
								} else {
									this.ignoredComplianceIssues.push(comp);
								}
							});
						}
					});
				}
			}

			private updateCounterMap(countMap: Map<any, number>, severity: any) {
				if (countMap.has(severity)) {
					if (countMap.has(severity)) {
						countMap.set(severity, countMap.get(severity) + 1);
					}
				} else {
					countMap.set(severity, 1);
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

	export interface RepoConfig extends RepositoryConfigPluginItem {
		thresholdVulnerability: TwistlockSeverity;
		thresholdCvss: number;
		thresholdCompliance: TwistlockSeverity;

		whitelist: Map<string, string>;
	}

	export class DefaultRepoConfig implements RepoConfig {
		enabled: boolean;
		thresholdVulnerability: TwistlockSeverity;
		thresholdCvss: number;
		thresholdCompliance: TwistlockSeverity;

		whitelist: Map<string, string>;

		constructor(repoConfig?: RepoConfig) {
			if (repoConfig) {
				this.enabled = repoConfig.enabled;
				this.thresholdCompliance = repoConfig.thresholdCompliance;
				this.thresholdCvss = repoConfig.thresholdCvss;
				this.thresholdVulnerability = repoConfig.thresholdVulnerability;
				if (repoConfig.whitelist) {
					this.whitelist = new Map<string, string>(Object.entries(repoConfig.whitelist));
				} else {
					this.whitelist = repoConfig.whitelist || new Map<string, string>();
				}
			} else {
				this.enabled = false;
				this.whitelist = new Map<string, string>();
				this.thresholdCompliance = TwistlockSeverity.LOW;
				this.thresholdCvss = 0;
				this.thresholdVulnerability = TwistlockSeverity.LOW;
			}
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
		severity: TwistlockSeverity;
	}

	export interface Vulnerability {
		id: string;
		status: string;
		cvss: number;
		vector: string;
		description: string;
		severity: VulnerabilitySeverity;
		packageName: string;
		packageVersion: string;
		link: string;
		riskFactors: Object;
	}

	export enum VulnerabilitySeverity {
		UNIMPORTANT = "unimportant",
		UNASSIGNED = "unassigned",
		NEGLIGIBLE = "negligible",
		LOW = "low",
		MEDIUM = "medium",
		MODERATE = "moderate",
		HIGH = "high",
		IMPORTANT = "important",
		CRITICAL = "critical"
	}

	export enum TwistlockSeverity {
		LOW = "low",
		MEDIUM = "medium",
		HIGH = "high",
		CRITICAL = "critical"
	}

	export interface Template {
		report: Report;
		issues: TwistlockModel.util.FindingReport;
	}

	export class SeverityUtil {
		private static readonly twistlockOrder: TwistlockSeverity[] = [
			TwistlockSeverity.LOW,
			TwistlockSeverity.MEDIUM,
			TwistlockSeverity.HIGH,
			TwistlockSeverity.CRITICAL
		];

		private static readonly vulnerabilityOrder = [
			VulnerabilitySeverity.UNIMPORTANT,
			VulnerabilitySeverity.UNASSIGNED,
			VulnerabilitySeverity.NEGLIGIBLE,
			VulnerabilitySeverity.LOW,
			VulnerabilitySeverity.MEDIUM,
			VulnerabilitySeverity.MODERATE,
			VulnerabilitySeverity.HIGH,
			VulnerabilitySeverity.IMPORTANT,
			VulnerabilitySeverity.CRITICAL
		];

		private static compareSeverity(order: any[], compare: any, other: any): boolean {
			if (compare == other) return true;

			for (const i in order) {
				if (order[i] == compare) {
					return false;
				}

				if (order[i] == other) {
					return true;
				}
			}

			return false;
		}

		static isVulnerabilityEqualOrHigher(compare: VulnerabilitySeverity, other: VulnerabilitySeverity): boolean {
			return SeverityUtil.compareSeverity(this.vulnerabilityOrder, compare, other);
		}

		static isComplianceEqualOrHigher(compare: TwistlockSeverity, other: TwistlockSeverity): boolean {
			return SeverityUtil.compareSeverity(this.twistlockOrder, compare, other);
		}

		static convertToSwingletreeSeverity(severity: TwistlockSeverity): Swingletree.Severity {
			switch (severity) {
				case TwistlockSeverity.LOW: return Swingletree.Severity.INFO;
				case TwistlockSeverity.MEDIUM: return Swingletree.Severity.WARNING;
				case TwistlockSeverity.HIGH: return Swingletree.Severity.BLOCKER;
				case TwistlockSeverity.CRITICAL: return Swingletree.Severity.BLOCKER;
			}

			return Swingletree.Severity.INFO;
		}

		static getTwistlockSeverityFromRiskFactor(riskFactors: Object): TwistlockSeverity {
			if (riskFactors) {
				const keys = Object.keys(riskFactors);
				for (let k = 0; k < keys.length; k++) {
					for (let s = 0; s < this.twistlockOrder.length; s++) {
						if (keys[k].toLowerCase() == `${this.twistlockOrder[s]} severity`.toLowerCase()) {
							return this.twistlockOrder[s] as TwistlockSeverity;
						}
					}
				}
			}

			return TwistlockModel.TwistlockSeverity.LOW;
		}

		static convertVulnerability(severity: VulnerabilitySeverity): Swingletree.Severity {
			if (!this.isVulnerabilityEqualOrHigher(severity, VulnerabilitySeverity.MEDIUM)) return Swingletree.Severity.INFO;
			if (!this.isVulnerabilityEqualOrHigher(severity, VulnerabilitySeverity.HIGH)) return Swingletree.Severity.WARNING;
			if (!this.isVulnerabilityEqualOrHigher(severity, VulnerabilitySeverity.IMPORTANT)) return Swingletree.Severity.MAJOR;

			return Swingletree.Severity.BLOCKER;
		}

	}
}
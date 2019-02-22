"use strict";

export namespace Sonar {
	export interface MeasureDelta {
		delta: number;
		coverage: number;
	}

	export namespace model {
		export enum RuleType {
			CODE_SMELL = "CODE_SMELL",
			BUG = "BUG",
			VULNERABILITY = "VULNERABILITY",
			SECURITY_HOTSPOT = "SECURITY_HOTSPOT"
		}

		export enum Metrics {
			COVERAGE = "coverage",
			MAINTAINABILITY_RATING = "new_maintainability_rating",
			NEW_MAINTAINABILITY_RATING = "new_maintainability_rating",
			NEW_BRANCH_COVERAGE = "new_branch_coverage",
			NEW_CONDITIONS_TO_COVER = "new_conditions_to_cover",
			NEW_COVERAGE = "new_coverage",
			NEW_LINE_COVERAGE = "new_line_coverage",
			NEW_LINES_TO_COVER = "new_lines_to_cover",
			NEW_BLOCKER_VIOLATIONS = "new_blocker_violations",
			NEW_CODE_SMELLS = "new_code_smells",
			NEW_CRITICAL_VIOLATIONS = "new_critical_violations",
			NEW_INFO_VIOLATIONS = "new_info_violations",
			NEW_VIOLATIONS = "new_violations",
			NEW_MAJOR_VIOLATIONS = "new_major_violations",
			NEW_MINOR_VIOLATIONS = "new_minor_violations",
			NEW_VULNERABILITIES = "new_vulnerabilities"
		}

		export interface Paging {
			pageIndex: number;
			pageSize: number;
			total: number;
		}

		export interface Comment {
			key: string;
			login: string;
			htmlText: string;
			createdAt: Date;
		}

		export interface Component {
			key: string;
			enabled?: boolean;
			qualifier: string;
			name: string;
			longName: string;
			path?: string;
			measures?: Measure[];
		}

		export interface MeasuresResponse {
			component: MeasuresResponseComponent;
		}

		export interface MeasuresResponseComponent {
			id: string;
			key: string;
			name: string;
			description: string;
			qualifier: string;
			measures: Measure[];
		}

		export class MeasuresView {
			model: MeasuresResponseComponent;
			measures: Map<string, Measure>;

			constructor(model: MeasuresResponseComponent) {
				this.model = model;
				this.measures = new Map<string, Measure>();

				if (model.measures) {
					model.measures.forEach((measure: Measure) => {
						this.measures.set(measure.metric, measure);
					});
				}
			}
		}

		export interface MeasureComponentQuery {
			additionalFields?: string;
			component?: string;
			metricKeys: string;
			branch: string;
		}

		export interface IssueQuery {
			componentKeys?: string;
			assigned?: boolean;
			languages?: string;
			p?: number;
			ps?: number;
			resolved?: boolean;
			statuses?: string;
			branch?: string;
			createdAt?: string;
		}

		export interface Measure {
			metric: string;
			value: string;
			bestValue: boolean;
		}


		export interface Metric {
			key: string;
			name: string;
			description: string;
			domain: string;
			type: string;
			higherValuesAreBetter: boolean;
			qualitative: boolean;
			hidden: boolean;
			custom: boolean;
		}

		export interface Issue {
			key: string;
			component: string;
			project: string;
			rule: string;
			status: "OPEN" | "REOPENED" | "CONFIRMED" | "RESOLVED" | "CLOSED";
			resolution: string;
			severity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
			type: string;
			message: string;
			effort: string;
			debt: string;
			tags: string[];
			line: number;
			hash?: string;
			textRange?: TextRange;
			author: string;
			creationDate: Date;
			updateDate: Date;
			comments: Comment[];
		}

		export interface TextRange {
			startLine: number;
			endLine: number;
			startOffset?: number;
			endOffset?: number;
		}

		export interface IssueResponse {
			securityExclusions: boolean;
			maxResultsReached: boolean;
			paging: Paging;
			issues: Issue[];
			components: Component[];
		}

		export interface MeasureHistoryQuery {
			component: string;
			metrics: string;
			p?: number;
			ps?: number;
			branch?: string;
		}

		export interface MeasureHistoryResponse {
			paging: Paging;
			measures: MeasureHistory[];
		}

		export interface MeasureHistory {
			metric: string;
			history: MeasureHistoryItem[];
		}

		export interface MeasureHistoryItem {
			date: string;
			value: string;
		}
	}
}
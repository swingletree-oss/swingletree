"use strict";

export enum RuleType {
	CODE_SMELL = "CODE_SMELL",
	BUG = "BUG",
	VULNERABILITY = "VULNERABILITY",
	SECURITY_HOTSPOT = "SECURITY_HOTSPOT"
}

export enum SonarMetrics {
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

export interface SonarPaging {
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

export interface SonarComponent {
	key: string;
	enabled?: boolean;
	qualifier: string;
	name: string;
	longName: string;
	path?: string;
	measures?: SonarMeasure[];
}

export interface SonarMeasuresResponse {
	component: SonarMeasuresResponseComponent;
}

export interface SonarMeasuresResponseComponent {
	id: string;
	key: string;
	name: string;
	description: string;
	qualifier: string;
	measures: SonarMeasure[];
}

export class SonarMeasuresView {
	model: SonarMeasuresResponseComponent;
	measures: Map<string, SonarMeasure>;

	constructor(model: SonarMeasuresResponseComponent) {
		this.model = model;
		this.measures = new Map<string, SonarMeasure>();

		if (model.measures) {
			model.measures.forEach((measure: SonarMeasure) => {
				this.measures.set(measure.metric, measure);
			});
		}
	}
}

export interface SonarMeasureComponentQuery {
	additionalFields?: string;
	component?: string;
	metricKeys: string;
	branch: string;
}

export interface SonarIssueQuery {
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

export interface SonarMeasure {
	metric: string;
	value: string;
	bestValue: boolean;
}


export interface SonarMetric {
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

export interface SonarIssue {
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
	textRange?: SonarTextRange;
	author: string;
	creationDate: Date;
	updateDate: Date;
	comments: Comment[];
}

export interface SonarTextRange {
	startLine: number;
	endLine: number;
	startOffset?: number;
	endOffset?: number;
}

export interface SonarIssueResponse {
	securityExclusions: boolean;
	maxResultsReached: boolean;
	paging: SonarPaging;
	issues: SonarIssue[];
	components: SonarComponent[];
}

export interface SonarMeasureHistoryQuery {
	component: string;
	metrics: string;
	p?: number;
	ps?: number;
}

export interface SonarMeasureHistoryResponse {
	paging: SonarPaging;
	measures: SonarMeasureHistory[];
}

export interface SonarMeasureHistory {
	metric: string;
	history: SonarMeasureHistoryItem[];
}

export interface SonarMeasureHistoryItem {
	date: string;
	value: string;
}
"use strict";

export enum RuleType {
	CODE_SMELL = "CODE_SMELL",
	BUG = "BUG",
	VULNERABILITY = "VULNERABILITY",
	SECURITY_HOTSPOT = "SECURITY_HOTSPOT"
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

export interface Component {
	key: string;
	enabled?: boolean;
	qualifier: string;
	name: string;
	longName: string;
	path?: string;
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
	components: Component[];
}
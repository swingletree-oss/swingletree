"use strict";

type SonarPaging = {
	pageIndex: number;
	pageSize: number;
	total: number;
	pages: number;
};

type Comment = {
	key: string;
	login: string;
	htmlText: string;
	createdAt: Date;
};

type Component = {
	key: string;
	enabled?: boolean;
	qualifier: string;
	name: string;
	longName: string;
	path?: string;
};

type SonarIssue = {
	key: string;
	component: string;
	project: string;
	rule: string;
	status: "OPEN" | "REOPENED" | "CONFIRMED" | "RESOLVED" | "CLOSED";
	resolution: string;
	severity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
	message: string;
	line: number;
	author: string;
	creationDate: Date;
	updateDate: Date;
	comments: Comment[];
};

type SonarIssueResponse = {
	securityExclusions: boolean;
	maxResultsReached: boolean;
	paging: SonarPaging;
	issues: SonarIssue;
	components: Component[];
};
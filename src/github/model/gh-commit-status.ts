"use strict";

/** GitHub Commit Status types
 */
export enum CommitStatusEnum {
	success = "success",
	pending = "pending",
	failure = "failure"
}

/** Container for GitHub Commit Status
 */
export class GithubCommitStatusContainer {
	commitId: string;
	repository: string;
	payload: GithubCommitStatus;

	constructor(repository: string, commitId: string) {
		this.commitId = commitId;
		this.repository = repository;
	}
}

/** GitHub Commit Status request payload
 */
export class GithubCommitStatus {
	state: CommitStatusEnum;
	target_url: string;
	description: string;
	context: string;

	constructor(state: CommitStatusEnum) {
		this.state = state;
	}
}
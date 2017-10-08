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
export class GitHubGhCommitStatusContainer {
	commitId: string;
	repository: string;
	payload: GitHubGhCommitStatus;

	constructor(repository: string, commitId: string) {
		this.commitId = commitId;
		this.repository = repository;
	}
}

/** GitHub Commit Status request payload
 */
export class GitHubGhCommitStatus {
	state: CommitStatusEnum;
	target_url: string;
	description: string;
	context: string;

	constructor(state: CommitStatusEnum) {
		this.state = state;
	}
}
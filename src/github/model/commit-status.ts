"use strict";

export enum CommitStatusEnum {
  success = "success",
  pending = "pending",
  failure = "failure"
}

export class GitHubCommitStatusContainer {
  commitId: string;
  repository: string;
  payload: GitHubCommitStatus;

  constructor(repository: string, commitId: string) {
    this.commitId = commitId;
    this.repository = repository;
  }
}

export class GitHubCommitStatus {
  state: CommitStatusEnum;
  target_url: string;
  description: string;
  context: string;

  constructor(state: CommitStatusEnum) {
    this.state = state;
  }
}
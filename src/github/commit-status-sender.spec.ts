"use strict";

import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer, CommitStatusEnum } from "./model/gh-commit-status";
import CommitStatusSender from "./commit-status-sender";
import { EventEmitter } from "events";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import GithubClientService from "./client/github-client";
import { AppEvent } from "../app-events";
import EventBus from "../event-bus";
import { emit } from "cluster";

const unirest = require("unirest");
const sandbox = sinon.sandbox.create();

describe("CommitStatusSender", () => {
	let uut: CommitStatusSender;

	let mockStatus: GitHubGhCommitStatusContainer;

	let eventBusMock: any;
	let configurationMock: any;
	let githubClientMock: any;

	beforeEach(function () {

		eventBusMock = {
			emit: sinon.stub(),
			register: sinon.stub()
		};

		configurationMock = {
			get: sinon.stub().returns({
				context: "test"
			})
		};

		githubClientMock = {
			createCommitStatus: sinon.stub()
		};

		uut = new CommitStatusSender(
			eventBusMock,
			configurationMock,
			githubClientMock
		);
		mockStatus = new GitHubGhCommitStatusContainer("testRepository", "testCommitId");
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should send commit status on matching event", (done) => {
		mockStatus.payload = new GitHubGhCommitStatus(CommitStatusEnum.pending);
		githubClientMock.createCommitStatus.resolves();
		uut.sendStatus(mockStatus)
			.then(() => {
				sinon.assert.calledWith(eventBusMock.emit, AppEvent.statusSent);
				done();
			})
			.catch(() => {
				throw new Error();
			});
	});

});
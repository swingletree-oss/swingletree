"use strict";

import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer } from "./model/gh-commit-status";
import CommitStatusSender from "./commit-status-sender";
import { EventEmitter } from "events";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));

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
	let emitMock: any;

	beforeEach(function () {
		emitMock = sinon.stub();

		eventBusMock = {
			get: sinon.stub().returns(emitMock),
			on: sinon.stub()
		};

		configurationMock = {
			get: sinon.stub().returns({
				context: "test"
			})
		};

		githubClientMock = {
			getClient: sinon.stub().returns({
				repos: {
					createStatus: sinon.stub()
				}
			})
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
		uut.sendStatus(mockStatus);
		sinon.assert.calledWith(emitMock, AppEvent.statusSent);
	});

});
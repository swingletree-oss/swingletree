"use strict";

import { AppEvent } from "../app-events";
import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer } from "./model/gh-commit-status";
import { CommitStatusSender } from "./commit-status-sender";
import { EventEmitter } from "events";

import { expect, assert } from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';

chai.use(require("sinon-chai"));

const unirest = require("unirest");
const sandbox = sinon.createSandbox();

describe("CommitStatusSender", () => {
	let unit: CommitStatusSender;
	let emitter: EventEmitter;
	let mockStatus: GitHubGhCommitStatusContainer;
	let postStub: sinon.SinonSpy;
	
  beforeEach(function () {
		emitter = new EventEmitter();
		unit = new CommitStatusSender(emitter, "testApi");
		mockStatus = new GitHubGhCommitStatusContainer("testRepository", "testCommitId")
		
		
    postStub = sandbox.stub(unirest, 'post').returns({
			headers: sinon.stub().returnsThis,
			end: sinon.stub().yieldsOn(unit),
			send: sinon.stub().returnsThis
		});
  });
	
  afterEach(function () {
    sandbox.restore();
  });
	
  it("should send commit status on matching event", (done) => {
    
    emitter.on(AppEvent.statusSent, function (status, endpoint) {
      expect(endpoint).to.equal("testApi");
      expect(status).to.not.be.undefined;
      done();
    });
    
		
		emitter.emit(AppEvent.sendStatus, mockStatus);
  });
	
	it("should send status to GitHub API endpoint", (done) => {
    
    emitter.on(AppEvent.statusSent, function (status, endpoint) {
      sinon.assert.calledWith(postStub, "testApi/repos/testRepository/statuses/testCommitId");
      done();
    });
    
		
		emitter.emit(AppEvent.sendStatus, mockStatus);
  });
});
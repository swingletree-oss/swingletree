"use strict";

import { AppEvent } from "../models/events";
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
	
  beforeEach(function () {
		emitter = new EventEmitter();
		unit = new CommitStatusSender(emitter, "testApi");
		
    sandbox.stub(unirest, 'post').returns({
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
    
		
		emitter.emit(AppEvent.sendStatus, "test", sinon);
  });
});
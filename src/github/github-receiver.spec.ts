"use strict";

import { expect, assert } from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { GitHubWebhook } from "./github-receiver";
import { AppEvent } from "../models/events";
import { EventEmitter } from "events";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Webhook", () => {
	let unit: GitHubWebhook;
	let emitter: EventEmitter;
	let pullRequestData: any;
	let branchDeleteData: any;
	
  beforeEach(function () {
		emitter = new EventEmitter();
		unit = new GitHubWebhook(emitter);
		
		pullRequestData = { body: Object.assign({}, require("../../test/ghPullRequestEvent.json")) };
		pullRequestData.header = function () {};
		
		branchDeleteData = { body: Object.assign({}, require("../../test/ghDeleteEvent.json")) };
		branchDeleteData.header = function () {};
  });
	
  afterEach(function () {
    sandbox.restore();
  });
	
	
  it("should send analyzePR event on open PRs", (done) => {
    pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");
    
    emitter.on(AppEvent.analyzePR, function (data) {
      expect(data.id).to.equal(1337);
      expect(data.merged).to.equal(false);
      done();
    });
    
    emitter.on(AppEvent.webhookEventIgnored, function () {
      done(new Error("webhook event was ignored."))
    });

    unit.webhook(pullRequestData);
  });
  
  it("should send ignore event on closed PRs", (done) => {
    pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");
    pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");
    pullRequestData.body.action = "closed";
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    unit.webhook(pullRequestData);
  });
	
  it("should send delete event on 'deleted' webhook events with ref type 'branch'", (done) => {
    branchDeleteData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("delete");
    branchDeleteData.body.ref_type = "branch";
		
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    unit.webhook(pullRequestData);
  });
	
  it("should send ignore event on 'deleted' webhook events with ref type 'tag'", (done) => {
    branchDeleteData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("delete");
    branchDeleteData.body.ref_type = "tag";
		
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    unit.webhook(pullRequestData);
  });
  
  it("should send ignore event on irrelevant event type header values", (done) => {
    pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("some_other_type");
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    unit.webhook(pullRequestData);
  });
  
  it("should send ignore event on missing event type header", (done) => {
    pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns(undefined);
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    unit.webhook(pullRequestData);
  });
});

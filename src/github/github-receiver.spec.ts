"use strict";

import { expect, assert } from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { GitHubWebhook } from "./github-receiver";
import { AppEvent } from "../models/events";
import { EventEmitter } from "events";

chai.use(require("sinon-chai"));

function requestData() : any {
  return {
    body: {
      action: "opened",
      pull_request: {
        "number": 1337,
        merged: false,
        head: {
          repo: { full_name: "test/test" },
          ref: "change",
          sha: "abcdef"
        },
        base: {
          repo: { full_name: "base/test" },
          ref: "master",
          sha: "123456"
        }
      }
    }
  }
};

describe("Webhook", () => {
  it("should send analyzePR event on open PRs", (done) => {
    let emitter = new EventEmitter();
    const testData = requestData();
    testData.header = sinon.stub().withArgs("X-GitHub-Event").returns("pull_request");
    
    emitter.on(AppEvent.analyzePR, function (data) {
      expect(data.id).to.equal(1337);
      expect(data.merged).to.equal(false);
      done();
    });
    
    emitter.on(AppEvent.webhookEventIgnored, function () {
      done(new Error("webhook event was ignored."))
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(testData);
  });
  
  it("should send ignore event on closed PRs", (done) => {
    let emitter = new EventEmitter();

    let testData = requestData();
    testData.header = sinon.stub().withArgs("X-GitHub-Event").returns("pull_request");
    testData.body.action = "closed";
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(testData);
  });
  
  it("should send ignore event on irrelevant event type header values", (done) => {
    let emitter = new EventEmitter();

    let testData = requestData();
    testData.header = sinon.stub().withArgs("X-GitHub-Event").returns("some_other_type");
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(testData);
  });
  
  it("should send ignore event on missing event type header", (done) => {
    let emitter = new EventEmitter();

    let testData = requestData();
    testData.header = sinon.stub().withArgs("X-GitHub-Event").returns(undefined);
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(testData);
  });
});

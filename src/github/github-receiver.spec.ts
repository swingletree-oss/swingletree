"use strict";

import { expect, assert } from 'chai';

import { GitHubWebhook } from "./github-receiver";
import { AppEvent } from "../models/events";
import { EventEmitter } from "events";

function requestData() : any {
  return {
    body: {
      "type": "pull_request",
      repo: {
        name: "test"
      },
      payload: {
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
  }
};

describe("Webhook", () => {
  it("should send analyzePR event on open PRs", (done) => {
    let emitter = new EventEmitter();
    
    emitter.on(AppEvent.analyzePR, function (data) {
      expect(data.id).to.equal(1337);
      expect(data.merged).to.equal(false);
      done();
    });
    
    emitter.on(AppEvent.webhookEventIgnored, function () {
      done(new Error("webhook event was ignored."))
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(requestData());
  });
  
  it("should not send analyzePR event on closed PRs", (done) => {
    let emitter = new EventEmitter();

    let request = requestData();
    request.body.payload.action = "closed";
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("github");
      done();
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(request);
  });
});

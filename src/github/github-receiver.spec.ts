"use strict";

import {} from 'jest';

import { GitHubWebhook } from "./github-receiver"
import { AppEvent } from "../models/events"

var EventEmitter = require('events').EventEmitter;

function requestData() : any {
  return {
    "type": "pull_request",
    payload: {
      state: "opened",
      pull_request: {
        number: 1337,
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

let data : any = {
  body: requestData
};

describe("Webhook", () => {
  it("should send analyzePR event on open PRs", (done) => {
    let emitter = new EventEmitter();

    emitter.on(AppEvent.analyzePR, function (data) {
      expect(data.id).toBe(requestData.pull_request.number);
      expect(data.merged).toBe(requestData.pull_request.merged);
      done();
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(requestData());
  });
  
  it("should not send analyzePR event on closed PRs", (done) => {
    let emitter = new EventEmitter();

    let request = requestData();
    request.payload.action = "closed";
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).toBe("github");
      done();
    });

    let utt = new GitHubWebhook(emitter);
    utt.webhook(data);
  });
});

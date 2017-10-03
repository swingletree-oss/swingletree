"use strict";

import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../models/events";
import { GitHubCommitStatus, GitHubCommitStatusContainer } from "./model/commit-status";
import { EventEmitter } from "events";

const unirest = require("unirest");

class EventProcessor {
  eventEmitter: EventEmitter;
  apiEndpoint: string;

  constructor(eventEmitter: EventEmitter, apiEndpoint: string) {
    this.eventEmitter = eventEmitter;
    this.apiEndpoint = apiEndpoint;
    this.eventEmitter.on(AppEvent.sendStatus, this.sendStatus);
  }

  sendStatus(status: GitHubCommitStatusContainer) {
    unirest.post(this.apiEndpoint + "/repos/" + status.repository + "/statuses/" + status.commitId)
      .headers({"Accept": "application/json", "Content-Type": "application/json"})
      .send(event)
      .end(function(response: any) {
        this.eventEmitter.emit(AppEvent.statusSent, status);
      }
    );

    this.eventEmitter.emit(AppEvent.statusSent, this.apiEndpoint, status);
  }
}

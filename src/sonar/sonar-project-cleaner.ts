"use strict";

import { LOGGER } from "../logger";
import { AppEvent } from "../models/app-events";
import { EventEmitter } from "events";

const unirest = require("unirest");

export class SonarProjectCleaner {
	eventEmitter: EventEmitter;
	apiEndpoint: string;
	apiToken: string;

	constructor(eventEmitter: EventEmitter, apiEndpoint: string, apiToken: string) {
		this.eventEmitter = eventEmitter;
		this.apiEndpoint = apiEndpoint;

		this.eventEmitter.on(AppEvent.branchDeleted, this.cleanProject);
	}

	public cleanProject = (projectId: string) => {
		unirest.post(this.apiEndpoint + "/api/projects/delete")
			.headers({ "Authorization": this.apiToken + ":" })
			.queryString("project", projectId)
			.end(function(response: any) {
				if (response.error) {
					LOGGER.error("failed to delete sonar project %s", projectId);
					this.eventEmitter.emit(AppEvent.sonarProjectDeleted, false, projectId);
				} else {
					LOGGER.info("deleted sonar project with key %s", projectId);
					this.eventEmitter.emit(AppEvent.sonarProjectDeleted, true, projectId);
				}
			}
		);
	}
}

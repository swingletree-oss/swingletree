"use strict";

import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { LOGGER } from "../../logger";

import * as request from "request";
import { SonarIssueResponse, SonarIssueQuery, SonarIssue } from "../model/sonar-issue";

@injectable()
export class SonarClient {
	private configurationService: ConfigurationService;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
	) {
		this.configurationService = configurationService;
	}

	private async getIssue(projectKey: string, page = 1): Promise<SonarIssueResponse> {
		LOGGER.debug("retrieve page %s for project %s", page, projectKey);

		const queryParams: SonarIssueQuery = {
			componentKey: projectKey,
			statuses: "OPEN,CONFIRMED,REOPENED",
			resolved: false,
			p: page,
			ps: 1
		};

		const options: request.CoreOptions = {
			qs: queryParams,
			auth: {
				username: this.configurationService.get().sonar.token
			}
		};


		return new Promise<SonarIssueResponse>((resolve, reject) => {
			request(
				this.configurationService.get().sonar.base + "/api/issues/search",
				options,
				(error: any, response: request.Response, body: any) => {
					if (error) {
						reject(error);
					}

					if (response.statusCode != 200) {
						reject("Received HTTP status code " + response.statusCode);
					}

					LOGGER.info(JSON.stringify(response));
					LOGGER.info(body);
					resolve(JSON.parse(body) as SonarIssueResponse);
				}
			);
		});
	}

	public pagingNecessary(response: SonarIssueResponse): boolean {
		return response.paging.pageSize * response.paging.pageIndex < response.paging.total;
	}

	public getIssues(projectKey: string): Promise<SonarIssue[]> {
		return new Promise<SonarIssue[]>(async (resolve, reject) => {
			const issues: SonarIssue[] = [];

			let page = 0;
			let issuePage;
			try {
				do {
					issuePage = await this.getIssue(projectKey, page + 1);
					issues.concat(issuePage.issues);
					page = issuePage.paging.pageIndex;
				} while (this.pagingNecessary(issuePage));
			} catch (err) {
				LOGGER.warn("an error occured while paginating through issues of project %s. Skipping issue collection", projectKey);
				reject(err);
			}

			resolve(issues);
		});
	}
}
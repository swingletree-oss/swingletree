"use strict";

import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { LOGGER } from "../../logger";

import * as request from "request";
import { SonarIssueResponse, SonarIssueQuery, SonarIssue, SonarPaging } from "../model/sonar-issue";

@injectable()
export class SonarClient {
	private configurationService: ConfigurationService;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
	) {
		this.configurationService = configurationService;
	}

	private async getIssue(queryParams: SonarIssueQuery, page = 1): Promise<SonarIssueResponse> {
		LOGGER.debug("retrieve page %s for project %s", page, queryParams.componentKey);

		queryParams.p = page;

		const options: request.CoreOptions = {
			qs: queryParams,
		};

		// add auth to options, if sonar token is available
		if (this.configurationService.get().sonar.token) {
			options.auth = {
				username: this.configurationService.get().sonar.token
			};
		}

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

					resolve(JSON.parse(body) as SonarIssueResponse);
				}
			);
		});
	}

	public pagingNecessary(paging: SonarPaging): boolean {
		return paging.pageSize * paging.pageIndex < paging.total;
	}

	public getIssues(projectKey: string, createdAt: string): Promise<SonarIssue[]> {
		return new Promise<SonarIssue[]>(async (resolve, reject) => {
			let issues: SonarIssue[] = [];

			const query: SonarIssueQuery = {
				componentKey: projectKey,
				createdAt: createdAt,
				statuses: "OPEN,CONFIRMED,REOPENED",
				resolved: false
			};

			let page = 0;
			let issuePage;
			try {
				do {
					issuePage = await this.getIssue(query, page + 1);
					issues = issues.concat(issuePage.issues);
					page = issuePage.paging.pageIndex;
				} while (this.pagingNecessary(issuePage.paging));
			} catch (err) {
				LOGGER.error("an error occured while paginating through issues of project %s. Skipping issue collection", projectKey, err);
				reject(err);
			}

			resolve(issues);
		});
	}
}
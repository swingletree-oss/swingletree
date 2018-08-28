"use strict";

import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";

import * as request from "request";

@injectable()
export class SonarClient {
	private configurationService: ConfigurationService;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
	) {
		this.configurationService = configurationService;
	}

	private async getIssue(projectKey: string, page = 1): Promise<SonarIssueResponse> {
		const queryParams = {
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
					resolve(JSON.parse(body) as SonarIssueResponse);
				}
			);
		});
	}

	private pagingNecessary(response: SonarIssueResponse): boolean {
		return response.paging.pageSize * response.paging.pageIndex >= response.paging.total;
	}

	public getIssues(projectKey: string): Promise<SonarIssue[]> {
		return new Promise<SonarIssue[]>(async (resolve, reject) => {
			const issues: SonarIssue[] = [];

			let page = 0;
			let issuePage;
			do {
				issuePage = await this.getIssue(projectKey, page + 1);
				issues.concat(issuePage.issues);
				page = issuePage.paging.pageIndex;
			} while (this.pagingNecessary(issuePage));

			resolve(issues);
		});
	}
}
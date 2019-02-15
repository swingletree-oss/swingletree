"use strict";

import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { LOGGER } from "../../core/logger";

import * as request from "request";
import { SonarIssueResponse, SonarIssueQuery, SonarIssue, SonarPaging, SonarMeasureComponentQuery, SonarMetrics, SonarMeasuresResponse, SonarMeasuresView, SonarMeasuresResponseComponent } from "../model/sonar-issue";
import { HealthState } from "../../core/health-service";
import { Events, HealthStatusEvent } from "../../core/event/event-model";
import EventBus from "../../core/event/event-bus";


@injectable()
class SonarClient {
	private configurationService: ConfigurationService;
	private eventBus: EventBus;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(EventBus) eventBus: EventBus
	) {
		this.configurationService = configurationService;
		this.eventBus = eventBus;

		eventBus.register(Events.HealthCheckEvent, this.performHealthCheck, this);

		if (!this.configurationService.get().sonar.base) {
			LOGGER.warn("Sonar base URL seems to be not configured. This will lead to errors.");
		}
	}

	private performHealthCheck() {
		this.getVersion()
			.then(() => {
				this.eventBus.emit(
					new HealthStatusEvent({
						state: HealthState.UP,
						service: "sonarqube",
						timestamp: Date.now()
					})
				);
			})
			.catch((err) => {
				this.eventBus.emit(
					new HealthStatusEvent({
						state: HealthState.DOWN,
						service: "sonarqube",
						detail: `integration disrupted (${err})`,
						timestamp: Date.now()
					})
				);
			});
	}

	private async getIssue(queryParams: SonarIssueQuery, page = 1): Promise<SonarIssueResponse> {
		LOGGER.debug("retrieve page %s for project %s", page, queryParams.componentKeys);

		queryParams.p = page;

		return new Promise<SonarIssueResponse>((resolve, reject) => {
			request(
				this.configurationService.get().sonar.base + "/api/issues/search",
				this.requestOptions({
					qs: queryParams,
				}),
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							resolve(JSON.parse(body) as SonarIssueResponse);
						} else {
							if (error) {
								reject(error);
							} else {
								reject(new Error(`Sonar client request failed ${response.statusCode}`));
							}
						}
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	}

	private requestOptions(options: request.CoreOptions = {}): request.CoreOptions {
		if (this.configurationService.get().sonar.token) {
			options.auth = {
				username: this.configurationService.get().sonar.token
			};
		}

		return options;
	}

	public pagingNecessary(paging: SonarPaging): boolean {
		return paging.pageSize * paging.pageIndex < paging.total;
	}

	public getIssues(projectKey: string, branch: string): Promise<SonarIssue[]> {
		return new Promise<SonarIssue[]>(async (resolve, reject) => {
			let issues: SonarIssue[] = [];

			const query: SonarIssueQuery = {
				componentKeys: projectKey,
				branch: branch,
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
				LOGGER.error("an error occured while paginating through issues of project %s. Skipping issue collection\nCaused by: %s", projectKey, err);
				reject(err);
			}

			resolve(issues);
		});
	}

	public getMeasures(projectKey: string, metricKeys: string[], branch?: string): Promise<SonarMeasuresView> {
		const queryParams: SonarMeasureComponentQuery = {
			metricKeys: metricKeys.join(","),
			component: projectKey,
			branch: branch
		};

		return new Promise<SonarMeasuresView>(async (resolve, reject) => {
			request(
				this.configurationService.get().sonar.base + "/api/measures/component",
				this.requestOptions({
					qs: queryParams,
				}),
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							resolve(new SonarMeasuresView(JSON.parse(body).component as SonarMeasuresResponseComponent));
						} else {
							if (error) {
								reject(error);
							} else {
								reject(new Error(`Sonar client request failed ${response.statusCode}`));
							}
						}
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	}

	public async getMeasureValue(projectKey: string, metric: SonarMetrics, branch?: string): Promise<string> {
		const measureView = await this.getMeasures(projectKey, [ metric ], branch);
		return measureView.measures.get(metric).value;
	}

	public getVersion(): Promise<string> {
		return new Promise((resolve, reject) => {
			request(
				this.configurationService.get().sonar.base + "/api/server/version",
				this.requestOptions(),
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							resolve(body);
						} else {
							if (error) {
								LOGGER.error("sonar request failed: ", error);
								reject("connection failure");
							} else {
								reject(response.statusCode);
							}
						}
					} catch (err) {
						LOGGER.error("sonar request failed2: ", error);
						reject("connection failure");
					}
				}
			);
		});
	}
}

export default SonarClient;
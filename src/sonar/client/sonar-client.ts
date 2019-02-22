"use strict";

import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { LOGGER } from "../../logger";

import * as request from "request";
import { Sonar } from "./sonar-issue";
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

	private async getIssue(queryParams: Sonar.model.IssueQuery, page = 1): Promise<Sonar.model.IssueResponse> {
		LOGGER.debug("retrieve page %s for project %s", page, queryParams.componentKeys);

		queryParams.p = page;

		return new Promise<Sonar.model.IssueResponse>((resolve, reject) => {
			request(
				this.configurationService.get().sonar.base + "/api/issues/search",
				this.requestOptions({
					qs: queryParams,
				}),
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							resolve(JSON.parse(body) as Sonar.model.IssueResponse);
						} else {
							this.errorHandler(error, reject, response);
						}
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	}

	private errorHandler(error: any, reject: any, response: request.Response) {
		if (error) {
			reject(error);
		} else {
			reject(new Error(`Sonar client request failed ${response.statusCode}`));
		}
	}

	private requestOptions(options: request.CoreOptions = {}): request.CoreOptions {
		if (this.configurationService.get().sonar.token) {
			options.auth = {
				username: this.configurationService.get().sonar.token
			};
		}

		return options;
	}

	public pagingNecessary(paging: Sonar.model.Paging): boolean {
		return paging.pageSize * paging.pageIndex < paging.total;
	}

	public getIssues(projectKey: string, branch: string): Promise<Sonar.model.Issue[]> {
		return new Promise<Sonar.model.Issue[]>(async (resolve, reject) => {
			let issues: Sonar.model.Issue[] = [];

			const query: Sonar.model.IssueQuery = {
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

	public getMeasures(projectKey: string, metricKeys: string[], branch?: string): Promise<Sonar.model.MeasuresView> {
		const queryParams: Sonar.model.MeasureComponentQuery = {
			metricKeys: metricKeys.join(","),
			component: projectKey,
			branch: branch
		};

		return new Promise<Sonar.model.MeasuresView>(async (resolve, reject) => {
			request(
				this.configurationService.get().sonar.base + "/api/measures/component",
				this.requestOptions({
					qs: queryParams,
				}),
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							resolve(new Sonar.model.MeasuresView(JSON.parse(body).component as Sonar.model.MeasuresResponseComponent));
						} else {
							this.errorHandler(error, reject, response);
						}
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	}

	public async getMeasureValue(projectKey: string, metric: Sonar.model.Metrics, branch?: string): Promise<string> {
		const measureView = await this.getMeasures(projectKey, [ metric ], branch);
		return measureView.measures.get(metric).value;
	}

	public async getMeasureValueAsNumber(projectKey: string, metric: Sonar.model.Metrics, branch?: string): Promise<number> {
		const value = await this.getMeasureValue(projectKey, metric, branch);
		if (value != null) {
			return Number(value);
		}
		return null;
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
							this.errorHandler(error, reject, response);
						}
					} catch (err) {
						LOGGER.error("sonar request failed: ", err);
						reject(error);
					}
				}
			);
		});
	}

	public getMeasureHistory(projectKey: string, metric: string, branch?: string): Promise<Sonar.model.MeasureHistory> {
		const queryParams: Sonar.model.MeasureHistoryQuery = {
			component: projectKey,
			metrics: metric,
			ps: 2,
			branch: branch
		};

		return new Promise((resolve, reject) => {
			request(
				this.configurationService.get().sonar.base + "/api/measures/search_history",
				this.requestOptions({
					qs: queryParams
				}),
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							const history = <Sonar.model.MeasureHistoryResponse>JSON.parse(body);
							resolve(history.measures[0]);
						} else {
							this.errorHandler(error, reject, response);
						}
					} catch (err) {
						reject(error);
					}
				}
			);
		});
	}

	public async getMeasureHistoryDelta(projectKey: string, metric: string, branch?: string): Promise<Sonar.MeasureDelta> {
		const response = await this.getMeasureHistory(projectKey, metric, branch);

		if (response.history && response.history.length > 0) {
			let previous = 0;
			let current = 0;

			if (!!response.history[1]) {
				previous = Number(response.history[1].value);
			}

			if (!!response.history[0]) {
				current = Number(response.history[0].value);
			}

			return {
				coverage: current,
				delta: current - previous
			};
		}

		return null;
	}
}

export default SonarClient;
"use strict";

import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { LOGGER } from "../../logger";

import * as request from "request";
import { Sonar } from "./sonar-issue";
import { HealthState } from "../../core/health-service";
import { Events, HealthStatusEvent } from "../../core/event/event-model";
import EventBus from "../../core/event/event-bus";
import { SonarConfig } from "../sonar-config";

@injectable()
class SonarClient {
	private eventBus: EventBus;

	private readonly reqClient: request.RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(EventBus) eventBus: EventBus
	) {
		this.eventBus = eventBus;

		eventBus.register(Events.HealthCheckEvent, this.performHealthCheck, this);

		const base = configurationService.get(SonarConfig.BASE);
		const token = configurationService.get(SonarConfig.TOKEN);

		if (!base) {
			LOGGER.error("Sonar base URL seems to be not configured. This will lead to errors.");
		}

		let authOptions: request.AuthOptions;
		if (token) {
			authOptions = {
				username: token
			};
		}
		this.reqClient = request.defaults({
			json: true,
			auth: authOptions,
			baseUrl: base
		});
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
			this.reqClient(
				"/api/issues/search",
				{
					qs: queryParams,
				},
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							resolve(body as Sonar.model.IssueResponse);
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

	public pagingNecessary(paging: Sonar.model.Paging): boolean {
		return paging.pageSize * paging.pageIndex < paging.total;
	}

	public getIssues(projectKey: string, branch: string): Promise<Sonar.util.IssueSummary> {
		return new Promise<Sonar.util.IssueSummary>(async (resolve, reject) => {
			const result: Sonar.util.IssueSummary = {
				issues: [],
				components: new Map<string, Sonar.model.Component>()
			};

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
					result.issues = result.issues.concat(issuePage.issues);

					issuePage.components.forEach((component: Sonar.model.Component) => {
						if (!result.components.has(component.key)) {
							result.components.set(component.key, component);
						}
					});

					page = issuePage.paging.pageIndex;
				} while (this.pagingNecessary(issuePage.paging));
			} catch (err) {
				LOGGER.error("an error occured while paginating through issues of project %s. Skipping issue collection\nCaused by: %s", projectKey, err);
				reject(err);
			}

			resolve(result);
		});
	}

	public getMeasures(projectKey: string, metricKeys: string[], branch?: string): Promise<Sonar.model.MeasuresView> {
		const queryParams: Sonar.model.MeasureComponentQuery = {
			metricKeys: metricKeys.join(","),
			component: projectKey,
			branch: branch
		};

		return new Promise<Sonar.model.MeasuresView>(async (resolve, reject) => {
			this.reqClient(
				"/api/measures/component",
				{
					qs: queryParams,
				},
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							resolve(new Sonar.model.MeasuresView(body.component as Sonar.model.MeasuresResponseComponent));
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
			this.reqClient(
				"/api/server/version",
				{},
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
			this.reqClient(
				"/api/measures/search_history",
				{
					qs: queryParams
				},
				(error: any, response: request.Response, body: any) => {
					try {
						if (!error && response.statusCode == 200) {
							const history = <Sonar.model.MeasureHistoryResponse>body;
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
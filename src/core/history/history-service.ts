import { Client, RequestParams,	ApiResponse, RequestEvent } from "@elastic/elasticsearch";
import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { CoreConfig } from "../core-config";
import EventBus from "../event/event-bus";
import { Events, NotificationEvent } from "../event/event-model";
import { LOGGER } from "../../logger";
import { exists } from "fs";
import { Swingletree } from "../model";


@injectable()
export abstract class HistoryService {
	abstract getLatest(from: number, size: number): Promise<any>;
	abstract getLatestForSender(sender: string, branch: string): Promise<RequestEvent<any, any>>;
	abstract getOrgs(search?: string): Promise<RequestEvent<any, any>>;

	abstract isEnabled(): boolean;
}

@injectable()
export class ElasticHistoryService implements HistoryService {
	private readonly client: Client;
	private readonly index: string;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService,
		@inject(EventBus) eventBus: EventBus
	) {
		this.client = new Client({
			node: configService.get(CoreConfig.Elastic.NODE),
			auth: configService.getObject(CoreConfig.Elastic.AUTH)
		});

		this.index = configService.get(CoreConfig.Elastic.INDEX);

		eventBus.register(Events.NotificationEvent, this.handleNotificationEvent, this);
	}

	public isEnabled() {
		return true;
	}

	private async getEntry(sender: string, org: string, repo: string, sha: string) {
		const result: ApiResponse<SearchResponse<Swingletree.AnalysisReport>> = await this.client.search({
			index: this.index,
			body: {
				size: 1,
				query: {
					bool: {
						must: [],
						filter: [{
								bool: {
									must: [
										{ match: { "org.keyword": org }},
										{ match: { "repo.keyword": repo }},
										{ match: { "sha.keyword": sha }}
									]
								}
						}]
					}
				}
			}
		});

		if (result.body.hits.total.value > 0) {
			return result.body.hits.hits[0];
		} else {
			return null;
		}
	}

	public async handleNotificationEvent(event: NotificationEvent) {
		LOGGER.info("creating history entry (%s) %s", event.payload.sender, event.source.toRefString());

		if (!event.payload.timestamp) {
			event.payload.timestamp = new Date();
		}

		this.client.index({
			index: this.index,
			body: event.payload
		});
	}

	public async getLatest(from = 0, size= 10) {
		LOGGER.debug("get latest entries from %s, size %s", from, size);
		const searchParams: RequestParams.Search<any> = {
			index: this.index,
			body: {
				from: from,
				size: size,
				sort: [{
					timestamp: {
						order: "desc"
					}
				}]
			}
		};

		return (await this.client.search(searchParams)).body;
	}

	public async getLatestForSender(sender: string, branch: string) {
		const searchParams: RequestParams.Search<any> = {
			index: this.index,
			body: {
				size: 10,
				query: {
					bool: {
						must: [],
						filter: [{
								bool: {
									must: [
										{ match: { "sender.keyword": sender }},
										{ match: { "branch.keyword": branch }}
									]
								}
						}]
					}
				},
				sort: [{
					timestamp: {
						order: "desc"
					}
				}]
			}
		};

		const result: ApiResponse<SearchResponse<Swingletree.AnalysisReport>> = await this.client.search(searchParams);

		return result;
	}

	public async getOrgs(search = "*") {
		const searchParams: RequestParams.Search = {
			index: this.index,
			body: {
				size: 0,
				aggs: {
					orgs: {
						terms: {
							field: "org.keyword"
						}
					}
				}
			}
		};

		const result: ApiResponse = await this.client.search(searchParams);

		return result.body.aggregations.orgs.buckets.map((item: any) => {
			return item.key;
		});
	}

}

@injectable()
export class NoopHistoryService implements HistoryService {
	constructor() {
		LOGGER.info("NOOP History Service registered.");
	}

	public isEnabled() {
		return false;
	}

	public async getLatest(from: number, size: number) {
		return Promise.resolve(null);
	}

	public async getLatestForSender(sender: string, branch: string) {
		return Promise.resolve(null);
	}

	public async getOrgs(search: string) {
		return Promise.resolve(null);
	}
}



interface SearchBody {
	from?: number;
	size?: number;
	query: {
		match?: {
			sender?: string;
			org?: string;
			repo?: string;
			sha?: string;
		},
		term?: {
			sender?: string;
			org?: string;
			repo?: string;
			sha?: string;
		}
	};
	sort?: any;
}

interface SearchResponse<T> {
	took: number;
	timed_out: boolean;
	hits: {
		total: {
			value: number;
		};
		max_score: number;
		hits: Array<{
			_index: string;
			_type: string;
			_id: string;
			_score: number;
			_source: T;
			_version?: number;
			fields?: any;
			sort?: string[];
		}>;
	};
	aggregations?: any;
}
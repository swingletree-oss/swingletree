import { Client, RequestParams,	ApiResponse } from "@elastic/elasticsearch";
import { injectable, inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { CoreConfig } from "../core-config";
import EventBus from "../event/event-bus";
import { Events, NotificationEvent, NotificationEventData } from "../event/event-model";
import { LOGGER } from "../../logger";
import { exists } from "fs";

@injectable()
export class HistoryService {
	private readonly client: Client;
	private readonly index: string;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService,
		@inject(EventBus) eventBus: EventBus
	) {
		this.client = new Client({
			node: configService.get(CoreConfig.Elastic.NODE),
			auth: {
				apiKey: configService.get(CoreConfig.Elastic.API_KEY)
			}
		});

		this.index = configService.get(CoreConfig.Elastic.INDEX);

		eventBus.register(Events.NotificationEvent, this.handleNotificationEvent, this);
	}

	private async getEntry(sender: string, org: string, repo: string, sha: string) {
		const result: ApiResponse<SearchResponse<NotificationEventData>> = await this.client.search({
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
		LOGGER.info("creating history entry (%s) %s/%s@%s", event.payload.sender, event.owner, event.repo, event.payload.sha);

		if (!event.payload.timestamp) {
			event.payload.timestamp = new Date();
		}

		this.client.index({
			index: this.index,
			body: event.payload
		});
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
				sort: [
					{
						idx: {
							order: "desc"
						}
					}
				]
			}
		};

		const result: ApiResponse<SearchResponse<NotificationEventData>> = await this.client.search(searchParams);

		return result;
	}

	public async getOrgs(search = "*") {
		const searchParams: RequestParams.Search = {
			index: this.index,
			body: {
				size: 0,
				query: {
					match: {
						org: search
					}
				},
				aggs: {
					orgs: {
						terms: {
							field: "org"
						}
					}
				}
			}
		};

		return await this.client.search(searchParams);
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
import { injectable, inject } from "inversify";
import { LOGGER } from "../../logger";
import { RepositoryConfig, RepositorySourceConfigurable, Events, RawRepositoryConfig } from "./event-model";
import GithubClientService from "../github/client/github-client";

import * as NodeCache from "node-cache";
import EventBus from "./event-bus";

@injectable()
class EventConfigCache {
	private readonly TTL = 10;

	private cache: NodeCache;

	private readonly github: GithubClientService;
	private readonly eventBus: EventBus;

	constructor(
		@inject(GithubClientService) github: GithubClientService,
		@inject(EventBus) eventBus: EventBus
	) {
		this.cache = new NodeCache({
			stdTTL: this.TTL
		});

		this.eventBus = eventBus;
		this.github = github;

		this.eventBus.register(Events.EventAugmentionEvent, this.eventAugmentionHandler, this);
	}

	public async eventAugmentionHandler(event: RepositorySourceConfigurable) {
		LOGGER.debug("augmenting event %s for %s/%s", event.eventType, event.owner, event.repo);

		try {
			event.config = await this.get(event.owner, event.repo);
		} catch (err) {
			LOGGER.warn("failed to augment event: %s", err);
		}

		event.augmented = true;
		this.eventBus.emit(event);
	}

	/** Tries to retrieve configuration from cache. On cache miss: retrieve from GitHub
	 *
	 * @param owner owner of the repo
	 * @param repo repository name
	 */
	public async get(owner: string, repo: string): Promise<RepositoryConfig> {
		let val: RawRepositoryConfig = this.cache.get(`${owner}/${repo}`);

		if (val == undefined) {
			LOGGER.debug("event config cache miss. Retrieving entry.");
			val = await this.store(owner, repo);
		}

		return new RepositoryConfig(val);
	}

	public async store(owner: string, repo: string): Promise<RawRepositoryConfig> {
		LOGGER.debug("retrieving configuration for %s/%s", owner, repo);
		try {
			const config = await this.github.getSwingletreeConfigFromRepository(owner, repo);
			this.cache.set(`${owner}/${repo}`, config);
			return config;
		} catch (err) {
			LOGGER.warn("failed to retrieve repository configuration for %s/%s: %s", owner, repo, err);
			return null;
		}
	}
}

export default EventConfigCache;
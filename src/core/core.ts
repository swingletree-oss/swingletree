import container from "../ioc-config";

import GithubWebhook from "./github/github-webhook";
import { LOGGER } from "../logger";
import PageRoutes from "./pages/page-routes";
import EventBus from "./event/event-bus";
import { CacheSyncEvent, PerformHealthCheckEvent } from "./event/event-model";
import InstallationStorage from "./github/client/installation-storage";
import { SwingletreeComponent } from "../component";
import { WebServer } from "./webserver";

class SwingletreeCore extends SwingletreeComponent.Component {
	private webserver: WebServer;
	private githubWebhook: GithubWebhook;
	private pageRoutes: PageRoutes;
	private eventBus: EventBus;

	constructor() {
		super("core");

		this.webserver = container.get<WebServer>(WebServer);
		this.githubWebhook = container.get<GithubWebhook>(GithubWebhook);
		this.pageRoutes = container.get<PageRoutes>(PageRoutes);
		this.eventBus = container.get<EventBus>(EventBus);
	}

	public run() {
		// bootstrap periodic events
		setInterval(() => { this.eventBus.emit(new CacheSyncEvent()); }, InstallationStorage.SYNC_INTERVAL);
		setInterval(() => { this.eventBus.emit(new PerformHealthCheckEvent()); }, 300000);

		// fire initial health check event after initialization grace period
		setTimeout(() => { this.eventBus.emit(new PerformHealthCheckEvent()); }, 10000);

		this.webserver.addRouter("/", this.pageRoutes.getRoute());
		this.webserver.setLocale("filters", this.pageRoutes.filters());
		this.webserver.addRouter("/webhook/github", this.githubWebhook.getRoute());
	}

	public isEnabled(): boolean {
		return true;
	}
}

export default SwingletreeCore;

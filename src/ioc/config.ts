import "reflect-metadata";

import { Container } from "inversify";

import ConfigurationService from "../configuration";
import CommitStatusSender from "../github/commit-status-sender";
import Identifiers from "./identifiers";
import GithubClientService from "../github/client/github-client";
import EventBus from "../event-bus";
import SwingletreeServer from "../swingletree";
import SonarWebhook from "../sonar/sonar-webhook";
import GithubWebhook from "../github/github-webhook";

const container = new Container();

container
	.bind<ConfigurationService>(Identifiers.ConfigurationService)
	.to(ConfigurationService);
container
	.bind<CommitStatusSender>(Identifiers.CommitStatusService)
	.to(CommitStatusSender);
container
	.bind<GithubClientService>(Identifiers.GithubClientService)
	.to(GithubClientService);
container
	.bind<EventBus>(Identifiers.EventBus)
	.to(EventBus);
container
	.bind<SwingletreeServer>(Identifiers.SwingletreeServer)
	.to(SwingletreeServer);
container
	.bind<SonarWebhook>(Identifiers.SonarWebhook)
	.to(SonarWebhook);
container
	.bind<GithubWebhook>(Identifiers.GithubWebhook)
	.to(GithubWebhook);

export default container;
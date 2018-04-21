import "reflect-metadata";

import { Container } from "inversify";

import ConfigurationService from "../configuration";
import CommitStatusSender from "../github/commit-status-sender";
import Identifiers from "./identifiers";
import { GithubClientService } from "../github/token/github-tokens";

const container = new Container();

container
	.bind<ConfigurationService>(Identifiers.ConfigurationService)
	.to(ConfigurationService);
container
	.bind<CommitStatusSender>(Identifiers.CommitStatusService)
	.to(CommitStatusSender);
container
	.bind<GithubTokenFactory>(Identifiers.GithubClientService)
	.to(GithubClientService);

export default container;
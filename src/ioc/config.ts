import "reflect-metadata";

import { Container } from "inversify";

import { ConfigurationService } from "../configuration";
import CommitStatusSender from "../github/commit-status-sender";
import GithubClientService from "../github/client/github-client";
import EventBus from "../event-bus";
import SwingletreeServer from "../swingletree";
import SonarWebhook from "../sonar/sonar-webhook";
import GithubWebhook from "../github/github-webhook";
import TokenStorage from "../github/client/token-storage";
import InstallationStorage from "../github/client/installation-storage";
import GhAppInstallationHandler from "../github/app-installation-handler";
import RedisClientFactory from "../redis-client";
import PageRoutes from "../pages/page-routes";
import { SonarClient } from "../sonar/client/sonar-client";
import { TemplateEngine } from "../template/template-engine";


const container = new Container();

container.bind<CommitStatusSender>(CommitStatusSender).toSelf().inSingletonScope();
container.bind<ConfigurationService>(ConfigurationService).toSelf().inSingletonScope();
container.bind<GithubClientService>(GithubClientService).toSelf().inSingletonScope();
container.bind<SonarClient>(SonarClient).toSelf().inSingletonScope();
container.bind<EventBus>(EventBus).toSelf().inSingletonScope();
container.bind<SwingletreeServer>(SwingletreeServer).toSelf().inSingletonScope();
container.bind<SonarWebhook>(SonarWebhook).toSelf().inSingletonScope();
container.bind<GithubWebhook>(GithubWebhook).toSelf().inSingletonScope();
container.bind<TokenStorage>(TokenStorage).toSelf().inSingletonScope();
container.bind<TemplateEngine>(TemplateEngine).toSelf().inSingletonScope();
container.bind<InstallationStorage>(InstallationStorage).toSelf().inSingletonScope();
container.bind<GhAppInstallationHandler>(GhAppInstallationHandler).toSelf().inSingletonScope();
container.bind<RedisClientFactory>(RedisClientFactory).toSelf().inSingletonScope();
container.bind<PageRoutes>(PageRoutes).toSelf().inSingletonScope();

export default container;
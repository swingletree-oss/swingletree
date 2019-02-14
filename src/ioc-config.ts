import "reflect-metadata";

import { Container } from "inversify";

import { ConfigurationService } from "./core/config/configuration";
import CommitStatusSender from "./core/github/commit-status-sender";
import GithubClientService from "./core/github/client/github-client";
import EventBus from "./core/event/event-bus";
import GithubWebhook from "./core/github/github-webhook";
import TokenStorage from "./core/github/client/token-storage";
import InstallationStorage from "./core/github/client/installation-storage";
import GhAppInstallationHandler from "./core/github/app-installation-handler";
import RedisClientFactory from "./core/db/redis-client";
import PageRoutes from "./core/pages/page-routes";
import { TemplateEngine } from "./core/template/template-engine";
import HealthService from "./core/health-service";


const container = new Container();

container.bind<CommitStatusSender>(CommitStatusSender).toSelf().inSingletonScope();
container.bind<ConfigurationService>(ConfigurationService).toSelf().inSingletonScope();
container.bind<GithubClientService>(GithubClientService).toSelf().inSingletonScope();
container.bind<HealthService>(HealthService).toSelf().inSingletonScope();
container.bind<EventBus>(EventBus).toSelf().inSingletonScope();
container.bind<GithubWebhook>(GithubWebhook).toSelf().inSingletonScope();
container.bind<TokenStorage>(TokenStorage).toSelf().inSingletonScope();
container.bind<TemplateEngine>(TemplateEngine).toSelf().inSingletonScope();
container.bind<InstallationStorage>(InstallationStorage).toSelf().inSingletonScope();
container.bind<GhAppInstallationHandler>(GhAppInstallationHandler).toSelf().inSingletonScope();
container.bind<RedisClientFactory>(RedisClientFactory).toSelf().inSingletonScope();
container.bind<PageRoutes>(PageRoutes).toSelf().inSingletonScope();

export default container;
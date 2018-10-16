import container from "./ioc/config";

import SwingletreeServer from "./swingletree";
import CommitStatusSender from "./github/commit-status-sender";
import GhAppInstallationHandler from "./github/app-installation-handler";
import SonarStatusEmitter from "./sonar/sonar-status-emitter";

const express = require("express");

// TODO: populate app installation database on startup

const swingletree = container.get<SwingletreeServer>(SwingletreeServer);

// initialize dangling event handlers
container.get<CommitStatusSender>(CommitStatusSender);
container.get<GhAppInstallationHandler>(GhAppInstallationHandler);
container.get<SonarStatusEmitter>(SonarStatusEmitter);

swingletree.run(express());
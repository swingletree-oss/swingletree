import container from "./ioc/config";

import SwingletreeServer from "./swingletree";
import CommitStatusSender from "./github/commit-status-sender";

const express = require("express");

// TODO: populate app installation database on startup

const swingletree = container.get<SwingletreeServer>(SwingletreeServer);
container.get<CommitStatusSender>(CommitStatusSender);
swingletree.run(express());
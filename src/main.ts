import container from "./ioc/config";

import SwingletreeServer from "./swingletree";
import CommitStatusSender from "./github/commit-status-sender";

const express = require("express");

const swingletree = container.get<SwingletreeServer>(SwingletreeServer);
container.get<CommitStatusSender>(CommitStatusSender);
swingletree.run(express());
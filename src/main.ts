import SwingletreeServer from "./swingletree";

import container from "./ioc/config";
import Identifiers from "./ioc/identifiers";

const express = require("express");

const swingletree = container.get<SwingletreeServer>(Identifiers.SwingletreeServer);
swingletree.run(express());
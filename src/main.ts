import SwingletreeServer from "./swingletree";

import container from "./ioc/config";
import Identifiers from "./ioc/identifiers";

// Composition root
let swingletree = container.get<SwingletreeServer>(Identifiers.SwingletreeServer);
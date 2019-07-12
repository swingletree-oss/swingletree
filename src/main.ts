import container from "./ioc-config";

import CommitStatusSender from "./core/github/commit-status-sender";
import GhAppInstallationHandler from "./core/github/app-installation-handler";
import SwingletreeCore from "./core/core";
import { LOGGER } from "./logger";
import { SwingletreeComponent } from "./component";
import { SonarQubePlugin } from "./sonar/sonar";
import { ZapPlugin } from "./zap/zap";
import { TwistlockPlugin } from "./twistlock/twistlock";

// initialize dangling event handlers
container.get<CommitStatusSender>(CommitStatusSender);
container.get<GhAppInstallationHandler>(GhAppInstallationHandler);

const registry = new SwingletreeComponent.Registry([
	SwingletreeCore,
	SonarQubePlugin,
	TwistlockPlugin,
	ZapPlugin
]);

registry.getComponents().forEach(component => {
	const plugin = new component();
	if (plugin.isEnabled()) {
		plugin.start();
	} else {
		LOGGER.info("component '%s' is disabled", component.name);
	}
});
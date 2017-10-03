import { GitHubWebhook } from "./github/github-receiver";
import { SonarWebhook } from "./sonar/sonar-receiver";
import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import { EventEmitter } from "events";
import * as path from "path";

const app = express();

// express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// global event bus
const eventBus = new EventEmitter();


// application webhooks with plumbing
const githubWebhook = new GitHubWebhook(eventBus);
const sonarWebhook = new SonarWebhook(eventBus);

console.log(eventBus);
// bind webhooks to paths
app.post("/webhook/github/", githubWebhook.webhook);
app.post("/webhook/sonar/", sonarWebhook.webhook);

// kickstart everything
app.listen(app.get("port"), () => {
  console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("  Press CTRL-C to stop\n");
});

module.exports = app;

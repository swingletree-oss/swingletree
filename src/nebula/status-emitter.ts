import { inject, injectable } from "inversify";
import { ConfigurationService } from "../configuration";
import { NebulaConfig } from "./config";
import EventBus from "../core/event/event-bus";
import { NotificationEvent } from "../core/event/event-model";
import { Swingletree } from "../core/model";
import { NebulaEvents } from "./events";
import { NebulaModel } from "./model";


interface ResultCount {
	failed: number;
	skipped: number;
	success: number;
	unknown: number;
}
@injectable()
export class NebulaStatusEmitter {
	private readonly eventBus: EventBus;
	private readonly context: string;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService
	) {
		this.eventBus = eventBus;
		this.context = configurationService.get(NebulaConfig.CONTEXT);

		eventBus.register(NebulaEvents.EventType.REPORT_RECEIVED, this.reportReceivedHandler, this);
	}

	public getAnnotations(report: NebulaModel.Report): Swingletree.Annotation[] {
		const annotations: Swingletree.Annotation[] = [];

		if (report.payload.build.tests) {
			report.payload.build.tests
				.filter((item) => item.result.status == NebulaModel.ResultValue.FAILURE)
				.forEach((failure) => {
					const annotation = new Swingletree.ProjectAnnotation();
					annotation.title = `Failed Test: ${failure.className} ${failure.methodName}`;
					annotation.detail = `${failure.suiteName} ${failure.className} ${failure.methodName}`;
					annotation.severity = Swingletree.Severity.BLOCKER;
					annotations.push(annotation);
				});

			report.payload.build.tests
				.filter((item) => item.result.status == NebulaModel.ResultValue.SKIPPED)
				.forEach((skipped) => {
					const annotation = new Swingletree.ProjectAnnotation();
					annotation.title = `Skipped Test: ${skipped.className} ${skipped.methodName}`;
					annotation.detail = `${skipped.suiteName} ${skipped.className} ${skipped.methodName}`;
					annotation.severity = Swingletree.Severity.INFO;
					annotations.push(annotation);
				});
		}

		return annotations;
	}

	private countTestResults(build: NebulaModel.BuildMetrics): ResultCount {
		const counts: ResultCount = { failed: 0, skipped: 0, success: 0, unknown: 0 };

		build.tests.reduce(
			(counter, currentValue) => {
				switch (currentValue.result.status) {
					case NebulaModel.ResultValue.FAILURE: counter.failed++; break;
					case NebulaModel.ResultValue.SUCCESS: counter.success++; break;
					case NebulaModel.ResultValue.SKIPPED: counter.skipped++; break;
					case NebulaModel.ResultValue.UNKNOWN:
					default: counter.unknown++; break;
				}
				return counter;
			},
			counts
		);

		return counts;
	}

	public reportReceivedHandler(event: NebulaEvents.ReportReceivedEvent) {
		const annotations = this.getAnnotations(event.report);
		const build = event.report.payload.build;

		const counts = this.countTestResults(build);

		const notificationData: Swingletree.AnalysisReport = {
			sender: this.context,
			source: event.source,
			checkStatus: event.report.payload.build.result.status == NebulaModel.ResultValue.SUCCESS ? Swingletree.Conclusion.PASSED : Swingletree.Conclusion.BLOCKED,
			title: `${event.report.payload.build.testCount} Tests`,
			metadata: {
				project: build.project,
				java: {
					version: build.info.javaVersion,
					detailVersion: build.info.detailedJavaVersion
				},
				gradle: {
					version: build.info.build.gradle.version
				},
				build: {
					id: build.buildId,
					elapsedTime: build.elapsedTime,
					startTime: build.startTime,
					finishedTime: build.finishedTime
				},
				test: {
					count: build.testCount
				}
			},
			annotations: annotations
		};

		if (counts.skipped > 0) {
			notificationData.title += `, ${counts.skipped} skipped`;
		}

		if (counts.failed > 0) {
			notificationData.title += `, ${counts.failed} failed`;
		}

		const notificationEvent = new NotificationEvent(notificationData);
		this.eventBus.emit(notificationEvent);
	}
}

export default NebulaStatusEmitter;
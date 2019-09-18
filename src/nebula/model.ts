export namespace NebulaModel {
	export enum ResultValue {
		UNKNOWN = "unknown",
		SUCCESS = "success",
		FAILURE = "failure",
		SKIPPED = "skipped"
	}

	interface KeyValue {
		key: string;
		value: string;
	}

	interface Result {
		status: ResultValue;
	}

	interface Event {
		description: string;
		type: string;
		elapsedTime: number;
	}

	interface Project {
		name: string;
		version: string;
	}

	interface Task {
		description: string;
		result: Result;
		startTime: string;
		elapsedTime: number;
	}

	interface Test {
		methodName: string;
		className: string;
		suiteName: string;
		result: Result;
		startTime: string;
		elapsedTime: number;
	}

	interface GradleBuild {
		version: string;
		parameters: Object;
		excludedTaskNames: string[];
		buildProjectDependencies: boolean;
		currentDir: string;
		searchUpwards: boolean;
		projectProperties: Object[];
		dryRun: boolean;
		rerunTasks: boolean;
		profile: boolean;
		continueOnFailure: boolean;
		offline: boolean;
		refreshDependencies: boolean;
		recompileScripts: boolean;
		parallelThreadCount: number;
		configureOnDemand: boolean;
	}

	interface BuildInfo {
		type: "gradle" | string;
		gradle: GradleBuild;
	}

	interface Scm {
		type: string;
	}

	interface Ci {
		type: string;
	}

	interface Info {
		build: BuildInfo;
		scm: Scm;
		ci: Ci;
		environmentVariables: KeyValue[];
		systemProperties: KeyValue[];
		javaVersion: string;
		detailedJavaVersion: string;
	}

	export interface BuildMetrics {
		buildId: string;
		project: Project;
		events: Event[];
		tasks: Task[];
		tests: Test[];
		info: Info;
		result: Result;
		startTime: string;
		elapsedTime: string;
		testCount: number;
		eventsCount: number;
		eventsElapsedTime: number;
		tasksElapsedTime: number;
		testElapsedTime: number;
		finishedTime: string;
		taskCount: number;
	}

	export interface Report {
		eventName: "build_metrics" | "build_logs" | string;
		payload: {
			buildId: string;
			build: BuildMetrics;
		};
	}
}
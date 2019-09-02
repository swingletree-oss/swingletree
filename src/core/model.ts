export namespace Swingletree {
	export enum Severity {
		BLOCKER = "blocker",
		MAJOR = "major",
		WARNING = "warning",
		INFO = "info"
	}

	export enum Conclusion {
		PASSED = "passed",
		UNDECISIVE = "undecisive",
		BLOCKED = "blocked",
		ANALYSIS_FAILURE = "analysis_failure"
	}

	/** Annotation superclass */
	export abstract class Annotation {
		readonly type: AnnotationType;
		title: string;
		detail: string;
		severity: Severity;

		constructor(type: AnnotationType) {
			this.type = type;
		}
	}

	/** An annotation, which can point to a specific file in the analysis context
	 */
	export class FileAnnotation extends Annotation {
		path: string;
		start?: number;
		end?: number;

		constructor() {
			super(AnnotationType.FILE);
		}
	}

	/** An annotation targeting the whole analyzed project
	 */
	export class ProjectAnnotation extends Annotation {
		constructor() {
			super(AnnotationType.PROJECT);
		}
	}

	export enum AnnotationType {
		FILE = "file",
		PROJECT = "project"
	}

	export interface AnalysisReport {
		/**
		 * Sender of this notification (plugin name)
		 */
		sender: string;
		source: ScmSource;
		link?: string;
		title: string;
		shortMessage?: string;
		markdown?: string;
		checkStatus?: Swingletree.Conclusion;
		annotations?: Swingletree.Annotation[];
		timestamp?: Date;
	}

	export abstract class ScmSource {
		type: ScmType;

		abstract toRefString(): string;

		constructor(type: ScmType) {
			this.type = type;
		}
	}

	export class GitSource extends ScmSource {
		repo: string;
		sha: string;
		branch: string[];

		public toRefString() {
			return `${this.repo}@${this.sha}`;
		}

		constructor() {
			super(ScmType.GIT);
		}
	}

	export class GithubSource extends ScmSource {
		owner: string;
		repo: string;
		sha: string;
		branch: string[];

		public toRefString() {
			return `${this.owner}/${this.repo}@${this.sha}`;
		}

		constructor() {
			super(ScmType.GITHUB);
		}
	}

	export enum ScmType {
		GITHUB = "github",
		GIT = "git"
	}

}
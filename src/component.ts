import { LOGGER } from "./logger";
import { Container } from "inversify";

export namespace SwingletreeComponent {

	export abstract class Component {
		public readonly name: string;
		protected readonly container: Container;

		constructor(name: string) {
			this.name = name;
		}

		public start(): void {
			LOGGER.info("starting component %s", this.name);
			this.run();
		}

		protected abstract run(): void;
		public abstract isEnabled(): boolean;
	}

	export class Registry {
		private static readonly components: { new(): Component }[] = [];

		public static add(component: { new(): Component }) {
			console.log("ADDDD");
			Registry.components.push(component);
		}

		public static getComponents(): Set<{ new(): Component }> {
			return new Set(Registry.components);
		}

	}
}



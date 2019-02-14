import { injectable, inject } from "inversify";
import EventBus from "./event/event-bus";
import { Events, HealthStatusEvent } from "./event/event-model";
import { LOGGER } from "./logger";

@injectable()
class HealthService {
	private state: Map<string, Health>;

	constructor(@inject(EventBus) eventBus: EventBus) {
		this.state = new Map<string, Health>();

		eventBus.register(Events.HealthStatusEvent, this.healthStatusEventHandler, this);
	}

	public healthStatusEventHandler(event: HealthStatusEvent) {
		if (event.health.state == HealthState.DOWN) {
			LOGGER.warn("component %s reported state DOWN. This may lead to a service interruption.", event.health.service);
		}

		this.setState(event.health);
	}

	private setState(health: Health) {
		this.state.set(health.service, health);
	}

	public getStates(healthState: HealthState = null): Health[] {
		if (healthState == null) {
			return Array.from(this.state.values());
		}

		const result: Health[] = [];
		this.state.forEach((item) => {
			if (item.state == healthState) {
				result.push(item);
			}
		});

		return result;
	}
}

export interface Health {
	state: HealthState;
	service: string;
	detail?: string;
	timestamp: number;
}

export enum HealthState {
	UP,
	DOWN
}

export default HealthService;
import { injectable } from "inversify";

@injectable()
class HealthService {
	private state: Map<string, Health>;

	constructor() {
		this.state = new Map<string, Health>();
	}

	public setState(health: Health) {
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

interface Health {
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
import { injectable } from "inversify/dts/annotation/injectable";
import { EventEmitter } from "events";

@injectable()
class EventBus {
	private readonly eventBus: EventEmitter;

	constructor() {
		this.eventBus = new EventEmitter();
	}

	public get(): EventEmitter {
		return this.eventBus;
	}
}

export default EventBus;
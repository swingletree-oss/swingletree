import { injectable } from "inversify";
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
import { injectable } from "inversify";
import { EventEmitter } from "events";
import { LOGGER } from "../logger";
import { SwingletreeEvent, Events } from "./event-model";

@injectable()
class EventBus {
	private readonly eventBus: EventEmitter;

	constructor() {
		this.eventBus = new EventEmitter();
	}

	public emit<T extends SwingletreeEvent>(event: T) {
		LOGGER.debug("app event %s emitted", event.getEventId());
		this.eventBus.emit(event.getEventId(), event);
	}

	public register<T extends SwingletreeEvent>(eventType: Events, handler: Function, context: any) {
		LOGGER.debug("handler for %s registered.", eventType);
		this.eventBus.on(eventType, this.handlerWrapper(handler, context, eventType));
	}

	private handlerWrapper(handler: Function, context: any, eventName: string): any {
		return (...args: any[]) => {
			try {
				handler.apply(context, args);
			} catch (err) {
				LOGGER.error("a handler for event %s encoutered an error.", eventName, err);
			}
		};
	}
}

export default EventBus;
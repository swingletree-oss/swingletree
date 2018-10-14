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

	public emit(event: SwingletreeEvent) {
		LOGGER.debug("app event %s emitted", event.getEventType());
		this.eventBus.emit(event.getEventType(), event);
	}

	public register(eventType: Events, handler: Function, context: any) {
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
import { injectable } from "inversify";
import { EventEmitter } from "events";
import { AppEvent } from "./app-events";
import { LOGGER } from "./logger";

@injectable()
class EventBus {
	private readonly eventBus: EventEmitter;

	constructor() {
		this.eventBus = new EventEmitter();
	}

	public emit(appEvent: AppEvent, eventArgument: any) {
		LOGGER.debug("app event %s emitted", appEvent);
		this.eventBus.emit(appEvent, eventArgument);
	}

	public register(appEvent: AppEvent, handler: Function, context: any) {
		LOGGER.debug("handler for %s registered.", appEvent);
		this.eventBus.on(appEvent, this.handlerWrapper(handler, context, appEvent));
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
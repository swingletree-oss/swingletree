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
		LOGGER.info("app event %s emitted", appEvent);
		this.eventBus.emit(appEvent, eventArgument);
	}

	public register(appEvent: AppEvent, handler: Function, context: any) {
		LOGGER.info("handler for %s registered.", appEvent);
		this.eventBus.on(appEvent, this.handlerWrapper(handler, context));
	}

	private handlerWrapper(handler: Function, context: any): any {
		return (...args: any[]) => {
			handler.apply(context, args);
		};
	}
}

export default EventBus;
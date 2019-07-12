import { injectable, inject } from "inversify";
import { EventEmitter } from "events";
import { LOGGER } from "../../logger";
import { SwingletreeEvent, RepositorySourceConfigurable, Events } from "./event-model";
import EventCache from "./event-config";

@injectable()
class EventBus {
	private readonly eventBus: EventEmitter;

	constructor() {
		this.eventBus = new EventEmitter();
	}

	/** Emits an Event to the Event Bus.
	 *
	 *  Registered event handlers will pick up and process the event.
	 */
	public async emit(event: SwingletreeEvent) {
		LOGGER.debug("app event %s emitted", event.getEventType());

		if (event instanceof RepositorySourceConfigurable && !event.augmented) {
			LOGGER.debug("passing event marked for augmentation to cache service.");
			this.eventBus.emit(Events.EventAugmentionEvent, event);
		} else {
			this.eventBus.emit(event.getEventType(), event);
		}
	}

	/** Registers an event handler on the Event Bus.
	 *
	 * @param eventType Event type to listen to
	 * @param handler handler function to execute
	 * @param context context of the handler function
	 */
	public register(eventType: string, handler: Function, context: object) {
		LOGGER.debug("%s registered a handler for %s ", context.constructor.name, eventType);
		this.eventBus.on(eventType, this.handlerWrapper(handler, context, eventType));
	}

	private handlerWrapper(handler: Function, context: any, eventName: string): any {
		return (...args: any[]) => {
			try {
				handler.apply(context, args);
			} catch (err) {
				LOGGER.error("a handler for event %s encountered an error: %s", eventName, err);
			}
		};
	}
}

export default EventBus;
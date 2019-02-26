---
title: Event Bus
permalink: /docs/eventbus/
redirect_from: /docs/index.html
---


### Event Bus

Swingletree uses an event bus for communication between its components. It is possible to acquire the event bus instance through dependency injection.

A webhook, for example, emits an Event when receiving a `POST` request. Components interested in this event can register an event handler to execute
business logic based on the payload data provided by the event.

### Using the Event Bus

A component can perform following actions on the Event Bus

* Register a listener for a specific event
* Emit a Event to the Event Bus

#### Register to an Event

```typescript
class EventConsumeExample {
  private eventBus: EventBus;

  constructor(@inject(EventBus) eventBus: EventBus) {
    this.eventBus.register(Events.CustomEventId, this.eventHandler, this);
  }

  public async sendAnalysisStatus(event: CustomEvent) {
    // event handling logic
  }
}
```

#### Emit an Event

```typescript
class EventEmitExample {
  private eventBus: EventBus;

  constructor(@inject(EventBus) eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public someFunction() {
    this.eventBus.emit(
      new SomeEvent(
        // event data
      )
    );
  }
}
```
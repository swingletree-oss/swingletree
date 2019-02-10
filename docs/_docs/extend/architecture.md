---
title: Architecture
permalink: /docs/architecture/
redirect_from: /docs/index.html
---

Swingletree uses an event bus for communication between its components. It is possible to acquire the event bus instance through dependency injection.

## Using the Event Bus

A component can perform following actions on the Event Bus

* Register a listener for a specific event
* Emit a Event to the Event Bus

### Register to an Event

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

### Emit an Event

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
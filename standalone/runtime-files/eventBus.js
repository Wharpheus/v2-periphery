// eventBus.js — Simple event bus for agent communication

/**
 * Implements a publish/subscribe event bus for agent communication.
 * Features:
 *   - emit(eventType, payload): Notify all listeners for eventType.
 *   - on(eventType, handler): Subscribe handler to eventType.
 *   - off(eventType, handler): Unsubscribe handler from eventType.
 *   - once(eventType, handler): Subscribe handler for a single event.
 */
class EventBus {
  constructor() {
    this.listeners = {};
  }

  // Subscribe to an event type
  on(eventType, handler) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(handler);
  }

  // Unsubscribe a handler from an event type
  // Handles both direct handlers and 'once' wrappers
  off(eventType, handler) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(h =>
      h !== handler && h._originalHandler !== handler
    );
    if (this.listeners[eventType].length === 0) {
      delete this.listeners[eventType];
    }
  }

  // Emit an event to all registered handlers
  emit(eventType, payload) {
    if (!this.listeners[eventType]) return;
    // Copy to avoid mutation during iteration
    const handlers = [...this.listeners[eventType]];
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] Handler error for event "${eventType}":`, err);
      }
    }
  }

  // Subscribe to an event type, but only fire once
  once(eventType, handler) {
    if (!eventType || typeof handler !== 'function') return;
    const wrapper = (payload) => {
      handler(payload);
      this.off(eventType, wrapper);
    };
    wrapper._originalHandler = handler;
    this.on(eventType, wrapper);
  }
}

const eventBus = new EventBus();

export default eventBus;
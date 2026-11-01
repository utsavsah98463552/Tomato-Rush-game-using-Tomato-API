/**
 * eventBus.js - tiny publish/subscribe event bus for the browser.
 * Author: Utsav Sah
 *
 * Modules do not call each other directly. The game controller *emits* events such as
 * "answer:result" and the UI module *listens* for them. This loose coupling is the
 * observer pattern, built on the browser's own EventTarget + CustomEvent.
 *
 * Reference: MDN, "Creating and triggering events"
 *   https://developer.mozilla.org/en-US/docs/Web/Events/Creating_and_triggering_events
 */

const bus = new EventTarget();

/** Publish an event with optional data. */
export function emit(name, detail = null) {
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Subscribe to an event. Returns a function that unsubscribes again. */
export function on(name, handler) {
  const listener = (event) => handler(event.detail);
  bus.addEventListener(name, listener);
  return () => bus.removeEventListener(name, listener);
}

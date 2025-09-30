// flowomaticEventRouter.js — hardened version
import { FlowomaticCoinsProcessor } from './flowomaticCoinsProcessor.js';

const eventHandlers = {
  workflow_complete: async (data) =>
    FlowomaticCoinsProcessor.issueCoins(
      data.userId,
      data.amount || 10,
      { note: 'Workflow complete reward' }
    ),

  referral_award: async (data) =>
    FlowomaticCoinsProcessor.issueCoins(
      data.userId,
      data.bonus || 25,
      { note: 'Referral award' }
    )
};

export class FlowomaticEventRouter {
  static logEvent(type, detail) {
    const stamp = new Date().toISOString();
    console.info(`[${stamp}][${type}]`, detail);
  }

  static validateEvent(event) {
    if (!event || typeof event !== 'object') {
      throw new Error('Event must be an object');
    }
    if (!event.type || typeof event.type !== 'string') {
      throw new Error('Event type must be a non-empty string');
    }
    if (!eventHandlers[event.type]) {
      throw new Error(`Unknown event type: ${event.type}`);
    }
    return true;
  }

  static async handleEvent(event) {
    try {
      this.validateEvent(event);
      const payload = event.payload || event;

      // Optionally validate payload fields for known events
      if (!payload.userId) {
        throw new Error(`Missing userId for event type: ${event.type}`);
      }

      this.logEvent('handleEvent:start', { type: event.type, payload });

      const result = await eventHandlers[event.type](payload);

      this.logEvent('handleEvent:success', { type: event.type, result });
      return result;
    } catch (err) {
      this.logEvent('handleEvent:error', { error: err.message, event });
      return { success: false, error: err.message };
    }
  }
}

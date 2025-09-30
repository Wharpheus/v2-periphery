// plugin.js — unified export with load stamp
import { FlowomaticCoinsProcessor } from './flowomaticCoinsProcessor.js';
import { FlowomaticEventRouter } from './flowomaticEventRouter.js';

const api = { FlowomaticCoinsProcessor, FlowomaticEventRouter };

// Stamp load event so you can see when/if this module was pulled in
console.info(`[${new Date().toISOString()}] Flowomatic plugin loaded`, {
  exports: Object.keys(api)
});

// Modern ESM default and named exports
export { FlowomaticCoinsProcessor, FlowomaticEventRouter };
export default api;

// CommonJS interop (guarded for ESM)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

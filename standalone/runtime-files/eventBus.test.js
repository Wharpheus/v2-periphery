// eventBus.test.js
// Tests for eventBus and agent event emission/subscription logic

import assert from 'assert';
import eventBus from './eventBus.js';

describe('EventBus', () => {
  it('should register and call event listeners', (done) => {
    let called = false;
    eventBus.on('test:event', (payload) => {
      called = true;
      assert.strictEqual(payload.foo, 42);
      done();
    });
    eventBus.emit('test:event', { foo: 42 });
  });

  it('should remove listeners with off()', () => {
    let called = false;
    function handler() { called = true; }
    eventBus.on('test:off', handler);
    eventBus.off('test:off', handler);
    eventBus.emit('test:off', {});
    assert.strictEqual(called, false);
  });

  it('should only call once listeners once', () => {
    let count = 0;
    eventBus.once('test:once', () => { count++; });
    eventBus.emit('test:once', {});
    eventBus.emit('test:once', {});
    assert.strictEqual(count, 1);
  });
});

describe('Agent event emission and subscription', () => {
  it('should emit and receive agent events', (done) => {
    // Simulate agent event emission and subscription
    eventBus.once('scaffold:completed', (payload) => {
      assert.strictEqual(payload.agent, 'agent_scaffolding_blueprint_50bf46');
      assert(payload.output);
      done();
    });
    eventBus.emit('scaffold:completed', {
      agent: 'agent_scaffolding_blueprint_50bf46',
      output: { foo: 'bar' },
      timestamp: new Date().toISOString()
    });
  });

  it('should allow agents to subscribe and react to other agent events', (done) => {
    // Simulate NFT mint event triggering landing page generation
    let landingTriggered = false;
    eventBus.once('nft:minted', (payload) => {
      landingTriggered = true;
      assert.strictEqual(payload.agent, 'nft_minting_transaction_flow_22536b');
      done();
    });
    eventBus.emit('nft:minted', {
      agent: 'nft_minting_transaction_flow_22536b',
      output: { txHash: '0x123' },
      timestamp: new Date().toISOString()
    });
    assert(landingTriggered === false); // Will be true after event loop
  });
});
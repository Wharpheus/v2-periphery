// copilot-agent-runtime/agents/SmartContractAgent.test.ts
// Tests validation and idempotency logic for SmartContractAgent

import SmartContractAgent from './SmartContractAgent';
import eventBus from '../../eventBus';

describe('SmartContractAgent', () => {
  let agent: SmartContractAgent;
  let events: any[];

  beforeEach(() => {
    agent = new SmartContractAgent();
    events = [];
    eventBus.on('contract:validation_failed', (payload) => events.push({ type: 'validation_failed', payload }));
    eventBus.on('contract:validated', (payload) => events.push({ type: 'validated', payload }));
  });

  afterEach(() => {
    eventBus.removeAllListeners('contract:validation_failed');
    eventBus.removeAllListeners('contract:validated');
  });

  it('should emit validation_failed for missing contractCode', () => {
    agent['handleContractSubmitted']({});
    expect(events[0].type).toBe('validation_failed');
    expect(events[0].payload.error).toMatch(/Missing or empty/);
  });

  it('should emit validation_failed for empty contractCode', () => {
    agent['handleContractSubmitted']({ contractCode: '' });
    expect(events[0].type).toBe('validation_failed');
    expect(events[0].payload.error).toMatch(/Missing or empty/);
  });

  it('should emit validation_failed for invalid syntax', () => {
    agent['handleContractSubmitted']({ contractCode: 'not solidity' });
    expect(events[0].type).toBe('validation_failed');
    expect(events[0].payload.error).toMatch(/syntax/);
  });

  it('should emit validated for valid contract', () => {
    agent['handleContractSubmitted']({ contractCode: 'contract Test {}', contractId: 'abc' });
    expect(events[0].type).toBe('validated');
    expect(events[0].payload.contractCode).toBe('contract Test {}');
    expect(events[0].payload.contractId).toBe('abc');
  });

  it('should ignore duplicate submissions (idempotency)', () => {
    agent['handleContractSubmitted']({ contractCode: 'contract Test {}', contractId: 'abc' });
    agent['handleContractSubmitted']({ contractCode: 'contract Test {}', contractId: 'abc' });
    // Only one validated event should be emitted
    expect(events.filter(e => e.type === 'validated').length).toBe(1);
  });

  it('should treat different contractId as separate contracts', () => {
    agent['handleContractSubmitted']({ contractCode: 'contract Test {}', contractId: 'abc' });
    agent['handleContractSubmitted']({ contractCode: 'contract Test {}', contractId: 'def' });
    expect(events.filter(e => e.type === 'validated').length).toBe(2);
  });
});
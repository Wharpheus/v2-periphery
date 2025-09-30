// quarantine/smart_contract_deployment_pipeline_6b5413_Agent.test.ts
// Tests validation and idempotency logic for DeploymentAgent

import DeploymentAgent from './smart_contract_deployment_pipeline_6b5413_Agent';
import eventBus from '../eventBus';

describe('DeploymentAgent', () => {
  let agent: DeploymentAgent;
  let events: any[];

  beforeEach(() => {
    agent = new DeploymentAgent();
    events = [];
    eventBus.on('contract:deployment_failed', (payload) => events.push({ type: 'deployment_failed', payload }));
    eventBus.on('contract:deployed', (payload) => events.push({ type: 'deployed', payload }));
  });

  afterEach(() => {
    eventBus.removeAllListeners('contract:deployment_failed');
    eventBus.removeAllListeners('contract:deployed');
  });

  it('should emit deployment_failed for missing contractCode', async () => {
    await agent['handleContractValidated']({});
    expect(events[0].type).toBe('deployment_failed');
    expect(events[0].payload.error).toMatch(/Missing or empty/);
  });

  it('should emit deployment_failed for empty contractCode', async () => {
    await agent['handleContractValidated']({ contractCode: '' });
    expect(events[0].type).toBe('deployment_failed');
    expect(events[0].payload.error).toMatch(/Missing or empty/);
  });

  it('should emit deployed for valid contract', async () => {
    await agent['handleContractValidated']({ contractCode: 'contract Test {}', contractId: 'abc' });
    expect(events[0].type).toBe('deployed');
    expect(events[0].payload.contractAddress).toMatch(/^0x/);
    expect(events[0].payload.contractId).toBe('abc');
  });

  it('should ignore duplicate deployments (idempotency)', async () => {
    await agent['handleContractValidated']({ contractCode: 'contract Test {}', contractId: 'abc' });
    await agent['handleContractValidated']({ contractCode: 'contract Test {}', contractId: 'abc' });
    // Only one deployed event should be emitted
    expect(events.filter(e => e.type === 'deployed').length).toBe(1);
  });

  it('should treat different contractId as separate deployments', async () => {
    await agent['handleContractValidated']({ contractCode: 'contract Test {}', contractId: 'abc' });
    await agent['handleContractValidated']({ contractCode: 'contract Test {}', contractId: 'def' });
    expect(events.filter(e => e.type === 'deployed').length).toBe(2);
  });

  it('should emit deployment_failed on simulated deployment failure', async () => {
    await agent['handleContractValidated']({ contractCode: 'failDeployment', contractId: 'fail' });
    expect(events[0].type).toBe('deployment_failed');
    expect(events[0].payload.error).toMatch(/Simulated deployment failure/);
  });

  it('should emit deployment_failed if contractId is missing', async () => {
    await agent['handleContractValidated']({ contractCode: 'contract Test {}' });
    expect(events[0].type).toBe('deployment_failed');
    expect(events[0].payload.error).toMatch(/Missing contractId/);
  });
});
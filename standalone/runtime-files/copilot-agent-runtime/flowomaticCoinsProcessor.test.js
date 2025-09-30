import { strict as assert } from 'assert';
import { FlowomaticCoinsProcessor } from './flowomaticCoinsProcessor.js';
import sinon from 'sinon';
import axios from 'axios';

describe('FlowomaticCoinsProcessor (Hardened)', function () {
  beforeEach(function () {
    process.env.FLOWOMATIC_API_KEY = 'testkey';
    process.env.FLOWOMATIC_API_URL = 'http://localhost';
    process.env.FLOWOMATIC_DEFAULT_USER_ID = 'default';
    process.env.FLOWOMATIC_USER_ID_ALIAS = 'alias';
    process.env.FLOWOMATIC_USER_EMAIL = 'test@example.com';
  });

  afterEach(function () {
    sinon.restore();
  });

  it('parses intent and finds entities', function () {
    const intent = 'reward user for workflow_complete';
    const parsed = FlowomaticCoinsProcessor.parseFlowomaticIntent(intent);
    assert.equal(parsed.type, 'flowomatic-coins');
    assert(parsed.entities.includes('user'));
  });

  it('detects gamification action', function () {
    const intent = 'I leveled up!';
    const parsed = FlowomaticCoinsProcessor.parseFlowomaticIntent(intent);
    assert.equal(parsed.action, 'gamification');
  });

  it('generates payload containing entities', function () {
    const parsed = { action: 'transaction', entities: ['user'], rewards: [], walletOps: [] };
    const payload = FlowomaticCoinsProcessor.generateFlowomaticPayload(parsed);
    assert(payload.entities && payload.entities.length > 0);
    assert.equal(payload.flowomaticAction, 'transaction');
  });

  it('throws FlowomaticError when missing userId in issueCoins', async function () {
    await assert.rejects(
      () => FlowomaticCoinsProcessor.issueCoins('', 10),
      /userId and amount are required/
    );
  });

  it('returns budget exceeded when amount > pool', async function () {
    // Drain pool for test without real network
    const stub = sinon.stub(axios, 'post').resolves({ data: { ok: true } });
    await FlowomaticCoinsProcessor.issueCoins('user1', 10000, {});
    stub.restore();

    const res = await FlowomaticCoinsProcessor.issueCoins('user2', 1);
    assert(!res.success);
    assert(/Budget exceeded/.test(res.error));
  });

  it('handles axios failure in issueCoins gracefully', async function () {
    sinon.stub(axios, 'post').rejects({ message: 'Network error', response: { data: 'fail', status: 500 } });
    const res = await FlowomaticCoinsProcessor.issueCoins('user', 10);
    assert(!res.success);
    assert(res.error);
  });

  it('retries transient axios failure before success', async function () {
    const stub = sinon.stub(axios, 'post');
    stub.onCall(0).rejects(new Error('Transient'));
    stub.onCall(1).resolves({ data: { ok: true } });
    const res = await FlowomaticCoinsProcessor.issueCoins('user', 5);
    assert(res.success);
    assert.equal(res.data.ok, true);
  });

  it('validateUserIds returns success results', async function () {
    sinon.stub(axios, 'post').resolves({ data: { status: 'ok' } });
    const results = await FlowomaticCoinsProcessor.validateUserIds(['id1']);
    assert.equal(results[0].success, true);
  });

  it('validateUserIds logs and returns error on failure', async function () {
    sinon.stub(axios, 'post').rejects({ message: 'fail', response: { data: 'bad', status: 400 } });
    const results = await FlowomaticCoinsProcessor.validateUserIds(['id1']);
    assert.equal(results[0].success, false);
    assert(results[0].error);
  });
});

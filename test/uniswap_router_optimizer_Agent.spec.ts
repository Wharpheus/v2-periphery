
import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as fs from 'fs';
import * as path from 'path';
import uniswap_router_optimizer_Agent from '../uniswap_router_optimizer_Agent';

describe('uniswap_router_optimizer_Agent', () => {
  it('should return optimization suggestions and gas savings', async () => {
    const payload = {
      target_contract: 'contracts/UniswapV2Router02.sol',
      metrics: {
        gas_usage: 1000000,
        tx_volume: 500
      },
      config: {
        optimization_level: 'high'
      }
    };
    const result = await uniswap_router_optimizer_Agent.execute(payload);

    // Write actual result to file for verification
    const outputPath = path.join(__dirname, 'agent_test_result.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log('Test result written to:', outputPath);
    console.log('Actual result data keys:', Object.keys(result.data || {}));

    expect(result.success).to.equal(true);
    expect(result.data).to.have.property('findings');
    expect(result.data).to.have.property('gas_savings');
    expect(result.data.gas_savings).to.be.greaterThan(0);
    expect(result.data.recommendations.length).to.be.greaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    // Pass an invalid payload to trigger error
    const payload = null;
    const result = await uniswap_router_optimizer_Agent.execute(payload);
    expect(result.success).to.equal(false);
    expect(result.error).to.contain('uniswap_router_optimizer_Agent Error');
  });
});

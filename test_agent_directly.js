// Direct test of the uniswap_router_optimizer_Agent
const uniswap_router_optimizer_Agent = require('./uniswap_router_optimizer_Agent.ts');

async function testAgent() {
  console.log('=== DIRECT AGENT TEST ===');

  // Test 1: Success case
  console.log('\n--- Test 1: Success Case ---');
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

  try {
    const result = await uniswap_router_optimizer_Agent.execute(payload);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Data keys:', Object.keys(result.data || {}));
    console.log('Gas savings:', result.data?.gas_savings);
    console.log('Recommendations count:', result.data?.recommendations?.length);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: Error case
  console.log('\n--- Test 2: Error Case ---');
  try {
    const result = await uniswap_router_optimizer_Agent.execute(null);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Error:', result.error);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testAgent().catch(console.error);

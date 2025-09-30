const agent = require('./uniswap_router_optimizer_Agent.js').default;

const payload = {
  target_contract: "contracts/UniswapV2Router02.sol",
  metrics: {
    gas_usage: 21000,
    tx_volume: 100
  },
  config: {
    optimization_level: "high"
  }
};

async function runAgent() {
  const result = await agent.execute(payload);
  console.log(result);
}

runAgent();

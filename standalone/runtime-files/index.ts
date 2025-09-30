// runtime/index.ts — hardened version
// import { MintNFTAgent } from './agents/MintNFTAgent'; // Disabled due to missing file
// import { SmartContractAgent } from './agents/SmartContractAgent'; // Disabled due to missing file
// import { LandingPageAgent } from './agents/LandingPageAgent'; // Disabled due to missing file
// import CodeDocumentationAgent from './agents/CodeDocumentationAgent'; // Disabled due to missing file
// import { GenericAgent } from './agents/GenericAgent';
import { AgentRegistry } from './AgentRegistry';
import { EventBus } from './eventBus';

const registry = new AgentRegistry();
const eventBus = new EventBus();

async function deploySmartContract(contractCode: string) {
  const syntaxAgent = registry.getAgent('SmartContractAgent');
  const securityAgent = registry.getAgent('SecurityAgent');
  const optimizationAgent = registry.getAgent('GasOptimizerAgent');
  const deploymentAgent = registry.getAgent('DeploymentAgent');

  let fixedCode = await syntaxAgent.fixErrors(contractCode);
  let secureCode = await securityAgent.scanAndFix(fixedCode);
  let optimizedCode = await optimizationAgent.optimizeGas(secureCode);

  return await deploymentAgent.deploy(optimizedCode);
}

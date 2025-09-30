import { ethers } from 'ethers';
import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';

const SmartContractAgent: AgentExecutor = {
  execute: async (payload) => {
    try {
      const { contractName, contractSource, constructorArgs = [], network, privateKey } = payload;

      // Compiler setup (assumes external compilation, or can add solc compile logic)
      const abi = payload.abi;
      const bytecode = payload.bytecode;

      // Provider + Signer
      const provider = new ethers.JsonRpcProvider(network);
      const signer = new ethers.Wallet(privateKey, provider);

      // Contract Factory
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      const contract = await factory.deploy(...constructorArgs);
      await contract.waitForDeployment();

      return SmartPayloadBuilder.success(`${contractName} deployed successfully`, {
        contractAddress: await contract.getAddress(),
        txHash: contract.deploymentTransaction().hash,
      });
    } catch (error) {
      return SmartPayloadBuilder.error('SmartContractAgent Error', error.message);
    }
  },
};

export default SmartContractAgent;

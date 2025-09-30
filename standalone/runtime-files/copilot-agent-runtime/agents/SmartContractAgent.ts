// smartContractAgent.ts — hardened replacement
import { ethers } from 'ethers';
import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';

const DEFAULTS = {
  network: 'http://localhost:8545', // override with payload.network
  gasLimit: 6_000_000
};

function validatePayload(payload: any) {
  const required = ['contractName', 'abi', 'bytecode', 'privateKey'];
  const missing = required.filter(k => !payload[k]);
  if (missing.length) {
    throw new Error(`Missing required payload fields: ${missing.join(', ')}`);
  }
}

export const SmartContractAgent: AgentExecutor = {
  execute: async (payload) => {
    try {
      validatePayload(payload);

      const {
        contractName,
        constructorArgs = [],
        network = DEFAULTS.network,
        privateKey,
        abi,
        bytecode,
        gasLimit = DEFAULTS.gasLimit
      } = payload;

      const provider = new ethers.JsonRpcProvider(network);
      const signer = new ethers.Wallet(privateKey, provider);

      console.info(`[${new Date().toISOString()}] Deploying ${contractName} to ${network}`);

      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      const contract = await factory.deploy(...constructorArgs, { gasLimit });
      await contract.waitForDeployment();

      const address = await contract.getAddress();
      const txHash = contract.deploymentTransaction().hash;

      console.info(`[${new Date().toISOString()}] ${contractName} deployed at ${address} (tx: ${txHash})`);

      return SmartPayloadBuilder.success(`${contractName} deployed successfully`, {
        contractAddress: address,
        txHash
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] SmartContractAgent error:`, error);
      return SmartPayloadBuilder.error('SmartContractAgent Error', error.message || String(error));
    }
  }
};

import eventBus from '../../eventBus';

// Improved SmartContractAgent with validation and idempotency
type ContractPayload = {
  contractCode: string;
  contractId?: string;
};

class SmartContractAgent {
  private processedContracts: Set<string>;

  constructor() {
    this.processedContracts = new Set();
    eventBus.on('contract:submitted', this.handleContractSubmitted.bind(this));
  }

  private getContractKey(payload: ContractPayload): string {
    // Prefer contractId if present, else hash code
    return payload.contractId || this.hashCode(payload.contractCode);
  }

  private hashCode(str: string): string {
    let hash = 0, i, chr;
    if (str.length === 0) return hash.toString();
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString();
  }

  handleContractSubmitted(payload: ContractPayload) {
    // Payload validation
    if (!payload || typeof payload.contractCode !== 'string' || payload.contractCode.trim() === '') {
      eventBus.emit('contract:validation_failed', { error: 'Invalid payload', payload });
      return;
    }
    // Basic Solidity syntax check
    if (!/contract\s+\w+/.test(payload.contractCode)) {
      eventBus.emit('contract:validation_failed', { error: 'Syntax error', payload });
      return;
    }
    // Idempotency check
    const contractKey = this.getContractKey(payload);
    if (this.processedContracts.has(contractKey)) {
      eventBus.emit('contract:validation_failed', { error: 'Duplicate contract submission', payload });
      return;
    }
    this.processedContracts.add(contractKey);
    eventBus.emit('contract:validated', payload);
  }
}

export default SmartContractAgent;

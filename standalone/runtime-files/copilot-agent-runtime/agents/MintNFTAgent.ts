// mintNFTAgent.ts — hardened replacement
import { ethers } from 'ethers';
import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';

const CONFIG = {
  providerUrl: process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  privateKey: process.env.NFT_MINTER_KEY || 'YOUR_PRIVATE_KEY',
  contractAddress: process.env.NFT_CONTRACT || 'YOUR_NFT_CONTRACT',
  abi: ['function mint(address to, string memory uri) public'],
  gasLimit: 500_000
};

function validatePayload(payload: any) {
  const missing = [];
  if (!payload.recipientAddress) missing.push('recipientAddress');
  if (!payload.tokenURI) missing.push('tokenURI');
  if (missing.length) {
    throw new Error(`Missing required payload fields: ${missing.join(', ')}`);
  }
}

export const MintNFTAgent: AgentExecutor = {
  execute: async (payload) => {
    try {
      validatePayload(payload);

      const { recipientAddress, tokenURI } = payload;
      const provider = new ethers.JsonRpcProvider(CONFIG.providerUrl);
      const signer = new ethers.Wallet(CONFIG.privateKey, provider);

      console.info(
        `[${new Date().toISOString()}] Minting NFT to ${recipientAddress} with URI ${tokenURI}`
      );

      const nftContract = new ethers.Contract(CONFIG.contractAddress, CONFIG.abi, signer);
      const tx = await nftContract.mint(recipientAddress, tokenURI, { gasLimit: CONFIG.gasLimit });
      await tx.wait();

      console.info(
        `[${new Date().toISOString()}] NFT minted: txHash=${tx.hash}, to=${recipientAddress}`
      );

      return SmartPayloadBuilder.success('NFT minted successfully', {
        txHash: tx.hash,
        to: recipientAddress,
        uri: tokenURI
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] MintNFTAgent error:`, error);
      return SmartPayloadBuilder.error(
        'MintNFTAgent Error',
        error.message || String(error)
      );
    }
  }
};

export default MintNFTAgent;

import { ethers } from 'ethers';
import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';

const MintNFTAgent: AgentExecutor = {
  execute: async (payload) => {
    try {
      // Extract user input
      const { recipientAddress, tokenURI } = payload;

      // Setup signer and contract
      const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
      const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

      const contractAddress = 'YOUR_NFT_CONTRACT';
      const abi = ['function mint(address to, string memory uri) public'];
      const nftContract = new ethers.Contract(contractAddress, abi, signer);

      // Call mint function
      const tx = await nftContract.mint(recipientAddress, tokenURI);
      await tx.wait();

      return SmartPayloadBuilder.success('NFT minted successfully', {
        txHash: tx.hash,
        to: recipientAddress,
        uri: tokenURI,
      });
    } catch (error) {
      return SmartPayloadBuilder.error('MintNFTAgent Error', error.message);
    }
  },
};

export default MintNFTAgent;

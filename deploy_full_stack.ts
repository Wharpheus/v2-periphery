import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

// Import artifacts from Foundry's out/ directory
import WETH9Artifact from "./out/WETH9.sol/WETH9.json";
// import FactoryArtifact from "./out/UniswapV2Factory.sol/UniswapV2Factory.json";
import RouterArtifact from "./out/UniswapV2Router01.sol/UniswapV2Router01.json";
// Add more imports as needed for your stack

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
  console.log("Deploying contracts with:", wallet.address);

  // Deploy WETH9
  const WETH9Factory = new ethers.ContractFactory(WETH9Artifact.abi, WETH9Artifact.bytecode.object, wallet);
  const weth = await WETH9Factory.deploy();
  await weth.waitForDeployment();
  console.log("WETH9 deployed at:", weth.target);

  // Deploy UniswapV2Router01 (without factory for now)
  const RouterFactory = new ethers.ContractFactory(RouterArtifact.abi, RouterArtifact.bytecode.object, wallet);
  // const router = await RouterFactory.deploy(factory.target, weth.target);
  // await router.waitForDeployment();
  // console.log("UniswapV2Router01 deployed at:", router.target);

  // Print all addresses for reference
  console.log("\n--- Deployment Complete ---");
  console.log("WETH9:", weth.target);
  // console.log("UniswapV2Factory:", factory.target);
  // console.log("UniswapV2Router01:", router.target);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});

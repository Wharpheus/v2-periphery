import { ethers } from "ethers";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const OUT_DIR = path.resolve(__dirname, "out");
const DEPLOYMENTS_DIR = path.resolve(__dirname, "deployments");

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error("Please set RPC_URL and PRIVATE_KEY in your .env file");
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL!);
  const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

  await fs.ensureDir(DEPLOYMENTS_DIR);
  const deployed: Record<string, { address: string; abi: any }> = {};

  const files = await fs.readdir(OUT_DIR);
  const deploymentPromises = files.map(async (file) => {
    if (!file.endsWith(".json")) return;
    const artifactPath = path.join(OUT_DIR, file);
    const artifact = await fs.readJson(artifactPath);
    const contractName = artifact.contractName || file.replace(/\.json$/, "");
    const abi = artifact.abi;
    const bytecode = artifact.bytecode?.object || artifact.bytecode;
    if (!abi || !bytecode || bytecode === "0x" || bytecode.length < 4) return;
    console.log(`Deploying ${contractName}...`);
    try {
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      deployed[contractName] = { address, abi };
      console.log(`  ${contractName} deployed at ${address}`);
    } catch (e) {
      console.error(`  Failed to deploy ${contractName}:`, e);
    }
  });

  await Promise.all(deploymentPromises);
  const outPath = path.join(DEPLOYMENTS_DIR, `deployments_${Date.now()}.json`);
  await fs.writeJson(outPath, deployed, { spaces: 2 });
  console.log(`\nAll deployments saved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

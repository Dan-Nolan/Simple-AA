import { ethers } from "hardhat";

async function main() {
  const ep = await ethers.deployContract("EntryPoint");

  await ep.waitForDeployment();

  console.log(`Deployed to ${ep.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

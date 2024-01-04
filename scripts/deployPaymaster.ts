import { ethers } from "hardhat";

async function main() {
  const pm = await ethers.deployContract("Paymaster");

  await pm.waitForDeployment();

  console.log(`Deployed to ${pm.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";

async function main() {
  const af = await ethers.deployContract("AccountFactory");

  await af.waitForDeployment();

  console.log(`Deployed to ${af.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

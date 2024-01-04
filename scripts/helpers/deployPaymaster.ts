import { ethers } from "hardhat";

export default async function deployPaymaster() {
  const pm = await ethers.deployContract("Paymaster");

  await pm.waitForDeployment();

  return pm;
}

import { ethers } from "hardhat";

export default async function deployFactory() {
  const af = await ethers.deployContract("AccountFactory");

  await af.waitForDeployment();

  return af;
}

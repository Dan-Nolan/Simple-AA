import { ethers } from "hardhat";

export default async function deployEntryPoint() {
  const ep = await ethers.deployContract("EntryPoint");

  await ep.waitForDeployment();

  return ep;
}

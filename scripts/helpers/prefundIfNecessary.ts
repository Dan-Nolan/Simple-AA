import { EntryPoint } from "../../typechain-types";
import { ethers } from "hardhat";

export default async function prefundIfNecessary(
  entryPoint: EntryPoint,
  paymasterAddr: string
) {
  const balanceOfAccount = await entryPoint.balanceOf(paymasterAddr);
  if (balanceOfAccount == 0n) {
    // prefund, if necessary
    await entryPoint.depositTo(paymasterAddr, {
      value: ethers.parseUnits(".2", "ether"),
    });
  }
}

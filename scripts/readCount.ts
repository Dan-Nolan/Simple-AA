import { ethers } from "hardhat";

const ACCOUNT_ADDR = "0xCDf5F7dfd18b9A7D668d2BcA5CdCAA64565c321A";

async function main() {
  const account = await ethers.getContractAt("Account", ACCOUNT_ADDR);
  console.log(await account.count());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

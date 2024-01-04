import { ethers } from "hardhat";

const ACCOUNT_ADDR = "0x75537828f2ce51be7289709686A69CbFDbB714F1";

async function main() {
  const account = await ethers.getContractAt("Account", ACCOUNT_ADDR);
  console.log(await account.count());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

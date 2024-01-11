import { ethers } from "hardhat";

const ACCOUNT_ADDR = "0x62136F1914fcFDe8329d54B8a2c7a297FD3d44c3";

async function main() {
  const account = await ethers.getContractAt("Account", ACCOUNT_ADDR);
  console.log(await account.count());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

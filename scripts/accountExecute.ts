import { ethers } from "hardhat";
import { EntryPoint } from "../typechain-types";
import { Typed } from "ethers";
import { UserOperationStruct } from "../typechain-types/@account-abstraction/contracts/core/EntryPoint";

const ENTRYPOINT = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
const FACTORY = "0x5081a39b8A5f0E35a8D959395a630b68B74Dd30f";
const FACTORY_NONCE = 1;

async function main() {
  const [signer0] = await ethers.getSigners();
  const address0 = await signer0.getAddress();

  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = EntryPoint.attach(ENTRYPOINT) as EntryPoint;

  const AccountFactory = await ethers.getContractFactory("AccountFactory");

  const sender = ethers.getCreateAddress({
    from: FACTORY,
    nonce: FACTORY_NONCE,
  });
  console.log("Account Address:", sender);
  const deployed = (await ethers.provider.getCode(sender)).length > 2;

  let initCode = "0x";
  if (!deployed) {
    // NOTE: the check for creating the sender is based on if initCode is present
    const initCallData = AccountFactory.interface.encodeFunctionData(
      "createAccount",
      [address0]
    );
    initCode = FACTORY + initCallData.slice(2);
  }

  const Account = await ethers.getContractFactory("Account");
  // here we can call whatever we'd like against the account itself
  // execute is a custom method defined on the Account smart contract
  const callData = Account.interface.encodeFunctionData("execute");

  const balanceOfAccount = await entryPoint.balanceOf(sender);
  if (balanceOfAccount == 0n) {
    // prefund, if necessary
    await entryPoint.depositTo(sender, {
      value: ethers.parseUnits("100", "ether"),
    });
  }

  // TODO: set more reasonable gas estimates?
  const ops: UserOperationStruct[] | Typed = [
    {
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData,
      callGasLimit: 10_000_000,
      verificationGasLimit: 10_000_000,
      preVerificationGas: 50_000,
      maxFeePerGas: ethers.parseUnits("1000", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("500", "gwei"),
      paymasterAndData: "0x",
      signature: "0x",
    },
  ];

  try {
    const tx = await entryPoint.handleOps(ops, address0);
    const receipt = await tx.wait();
    console.log("sent ops!", receipt);
  } catch (ex: any) {
    if (ex.data.data.length > 2) {
      console.error("Return Data Error:", decodeReturnData(ex.data.data));
    } else {
      console.log(ex);
    }
  }
}

function decodeReturnData(hexString: string) {
  const abiCoder = new ethers.AbiCoder();
  const decoded = abiCoder.decode(
    ["uint256", "string"],
    "0x" + hexString.slice(10)
  );
  return decoded[1];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

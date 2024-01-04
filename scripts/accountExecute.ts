import { ethers } from "hardhat";
import { EntryPoint } from "../typechain-types";
import { Typed } from "ethers";
import { UserOperationStruct } from "../typechain-types/@account-abstraction/contracts/core/EntryPoint";

const ENTRYPOINT = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const FACTORY = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const PAYMASTER = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
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

  const balanceOfAccount = await entryPoint.balanceOf(PAYMASTER);
  if (balanceOfAccount == 0n) {
    // prefund, if necessary
    await entryPoint.depositTo(PAYMASTER, {
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
      paymasterAndData: PAYMASTER,
      signature: "0x",
    },
  ];

  try {
    const tx = await entryPoint.handleOps(ops, address0);
    const receipt = await tx.wait();
    console.log("op call successful!", receipt?.hash);
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

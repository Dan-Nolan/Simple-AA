import { ethers } from "hardhat";
import { Typed } from "ethers";
import { UserOperationStruct } from "../typechain-types/@account-abstraction/contracts/core/EntryPoint";
import deployEntryPoint from "./helpers/deployEntryPoint";
import deployFactory from "./helpers/deployFactory";
import deployPaymaster from "./helpers/deployPaymaster";
import prefundIfNecessary from "./helpers/prefundIfNecessary";

const FACTORY_NONCE = 1;

async function main() {
  const entryPoint = await deployEntryPoint();
  const factory = await deployFactory();
  const factoryAddress = await factory.getAddress();
  const paymaster = await deployPaymaster();
  const paymasterAddr = await paymaster.getAddress();

  const [signer0] = await ethers.getSigners();
  const address0 = await signer0.getAddress();

  const AccountFactory = await ethers.getContractFactory("AccountFactory");

  const sender = ethers.getCreateAddress({
    from: factoryAddress,
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
    initCode = factoryAddress + initCallData.slice(2);
  }

  const Account = await ethers.getContractFactory("Account");
  // here we can call whatever we'd like against the account itself
  // execute is a custom method defined on the Account smart contract
  const callData = Account.interface.encodeFunctionData("execute");

  prefundIfNecessary(entryPoint, paymasterAddr);

  const signature = await signer0.signMessage(
    Uint8Array.from(Buffer.from(ethers.id("weee").slice(2), "hex"))
  );
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
      paymasterAndData: paymasterAddr,
      signature,
    },
  ];

  try {
    const tx = await entryPoint.handleOps(ops, address0);
    const receipt = await tx.wait();
    console.log("op call successful!", receipt?.hash);
  } catch (ex: any) {
    if (ex?.data?.data?.length > 2) {
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

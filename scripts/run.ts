import hre from "hardhat";
import { UserOperationStruct } from "../typechain-types/@account-abstraction/contracts/core/EntryPoint";
import deployFactory from "./helpers/deployFactory";
import deployPaymaster from "./helpers/deployPaymaster";
import prefundIfNecessary from "./helpers/prefundIfNecessary";
const { ethers } = hre;

const FACTORY_NONCE = 1;
const ENTRYPOINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const PAYMASTER = "0x395ebd630d2b0b58c85a6ad25d611b5c2328c01f";

async function main() {
  const entryPoint = await ethers.getContractAt("EntryPoint", ENTRYPOINT);
  const factory = await deployFactory();
  const factoryAddress = await factory.getAddress();
  // const paymaster = await deployPaymaster();
  const paymaster = await ethers.getContractAt("Paymaster", PAYMASTER);
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

  await prefundIfNecessary(entryPoint, paymasterAddr);

  const userOp: UserOperationStruct = {
    sender,
    nonce: "0x" + (await entryPoint.getNonce(sender, 0)).toString(16),
    initCode,
    callData,
    callGasLimit: "0x" + (10_000_000).toString(16),
    verificationGasLimit: "0x" + (10_000_000).toString(16),
    preVerificationGas: "0x" + (50_000).toString(16),
    maxFeePerGas: "0x" + ethers.parseUnits("10", "gwei").toString(16),
    maxPriorityFeePerGas: "0x" + ethers.parseUnits("5", "gwei").toString(16),
    paymasterAndData: paymasterAddr,
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
  };

  const { preVerificationGas, verificationGasLimit, callGasLimit }: any =
    await hre.network.provider.request({
      method: "eth_estimateUserOperationGas",
      params: [userOp, ENTRYPOINT],
    });
  userOp.preVerificationGas = preVerificationGas;
  userOp.verificationGasLimit = verificationGasLimit;
  userOp.callGasLimit = callGasLimit;

  const userOpHash = await entryPoint.getUserOpHash(userOp);
  userOp.signature = await signer0.signMessage(
    Uint8Array.from(Buffer.from(userOpHash.slice(2), "hex"))
  );

  try {
    console.log(userOp);
    const tx = await entryPoint.handleOps([userOp], address0);
    const receipt = await tx.wait();
    console.log("op call successful!", receipt?.hash);
  } catch (ex: any) {
    if (ex?.data?.data?.length > 2) {
      console.error("Return Data Error:", decodeReturnData(ex.data.data));
    } else if (ex?.data?.length > 2) {
      console.error("Return Data Error:", decodeReturnData(ex.data));
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

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "localhost",
  networks: {
    arb: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
    localhost: {
      allowUnlimitedContractSize: true,
    },
  },
};

export default config;

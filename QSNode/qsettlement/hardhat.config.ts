import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    qsmart: {
      url: process.env.QSMART_RPC_URL || "http://localhost:26657",
      chainId: parseInt(process.env.QSMART_CHAIN_ID || "1001"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL || "https://testnet.example.com",
      chainId: parseInt(process.env.TESTNET_CHAIN_ID || "1002"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://mainnet.example.com",
      chainId: parseInt(process.env.MAINNET_CHAIN_ID || "1000"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      qsmart: process.env.QSMART_API_KEY || "",
      testnet: process.env.TESTNET_API_KEY || "",
      mainnet: process.env.MAINNET_API_KEY || "",
    },
    customChains: [
      {
        network: "qsmart",
        chainId: parseInt(process.env.QSMART_CHAIN_ID || "1001"),
        urls: {
          apiURL: process.env.QSMART_API_URL || "https://api.qsmart.example.com",
          browserURL: process.env.QSMART_BROWSER_URL || "https://explorer.qsmart.example.com",
        },
      },
      {
        network: "testnet",
        chainId: parseInt(process.env.TESTNET_CHAIN_ID || "1002"),
        urls: {
          apiURL: process.env.TESTNET_API_URL || "https://api.testnet.example.com",
          browserURL: process.env.TESTNET_BROWSER_URL || "https://explorer.testnet.example.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Default private key for testing (don't use in production)
const DEFAULT_PRIVATE_KEY = "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "mantle-sepolia": {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "YOUR_DEPLOYER_PRIVATE_KEY_HERE" 
        ? [process.env.PRIVATE_KEY] 
        : [DEFAULT_PRIVATE_KEY],
      chainId: 5003,
    },
    "mantle-mainnet": {
      url: "https://rpc.mantle.xyz",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "YOUR_DEPLOYER_PRIVATE_KEY_HERE" 
        ? [process.env.PRIVATE_KEY] 
        : [DEFAULT_PRIVATE_KEY],
      chainId: 5000,
    },
  },
  etherscan: {
    apiKey: {
      "mantle-sepolia": "abc", // Mantle doesn't require real API key
      "mantle-mainnet": "abc",
    },
    customChains: [
      {
        network: "mantle-sepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://explorer.sepolia.mantle.xyz/api",
          browserURL: "https://explorer.sepolia.mantle.xyz",
        },
      },
      {
        network: "mantle-mainnet",
        chainId: 5000,
        urls: {
          apiURL: "https://explorer.mantle.xyz/api",
          browserURL: "https://explorer.mantle.xyz",
        },
      },
    ],
  },
};
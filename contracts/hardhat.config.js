require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "";
let PRIVATE_KEY = process.env.DEPLOYMENT_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Strip 0x prefix if present and validate length
if (PRIVATE_KEY && PRIVATE_KEY !== "your_private_key_here") {
  if (PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = PRIVATE_KEY.slice(2);
  }
  if (PRIVATE_KEY.length !== 64) {
    console.error(`\n❌ ERROR: DEPLOYMENT_PRIVATE_KEY must be 64 hex characters (32 bytes).\nFound: ${PRIVATE_KEY.length} characters\n`);
    console.error("Update contracts/.env with your actual wallet private key (no 0x prefix).\n");
    PRIVATE_KEY = ""; // Reset to avoid hardhat validation error
  }
}

module.exports = {
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
    amoy: {
      url: AMOY_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80002,
    },
    polygon: {
      url: POLYGON_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 137,
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      ...(PRIVATE_KEY ? { accounts: [PRIVATE_KEY] } : {}),
    },
    hardhat: {
      chainId: 1337,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

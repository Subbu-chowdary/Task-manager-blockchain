require("@nomiclabs/hardhat-waffle");
require("dotenv").config(); // Load environment variables from .env file

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, // Use environment variable for RPC URL
      accounts: [
        process.env.PRIVATE_KEY || "", // Use environment variable for private key
      ],
    },
  },
};

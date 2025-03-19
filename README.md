Below is the updated README.md in Markdown format, tailored for your Blockchain Task Manager project. It includes the live demo link (https://task-manager-blockchain-psi.vercel.app/), GitHub repository link (https://github.com/Subbu-chowdary/Task-manager-blockchain), and detailed setup, deployment, and testing instructions. The content reflects your use of the SepoliaETH testnet, transactions visible on Sepolia Etherscan, and the specific features of your project (e.g., Tailwind CSS, drag-and-drop persistence with localStorage, etc.).

Updated README.md
markdown

Collapse

Wrap

Copy
# Blockchain Task Manager

A decentralized task manager application built on the Ethereum blockchain (Sepolia testnet) using Solidity and React. This DApp allows users to manage tasks (create, update, delete, and reorder via drag-and-drop) with a responsive UI, dark mode support, and wallet-based authentication via MetaMask.

## Live Demo
- **Live Demo Link**: [https://task-manager-blockchain-psi.vercel.app/](https://task-manager-blockchain-psi.vercel.app/)

## GitHub Repository
- **GitHub Repository Link**: [https://github.com/Subbu-chowdary/Task-manager-blockchain](https://github.com/Subbu-chowdary/Task-manager-blockchain)

## Setup

### 1. Contract Deployment
The smart contract is deployed on the **SepoliaETH testnet**. You can view transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/).

#### Steps to Deploy the Contract (if needed):
1. **Install Hardhat**:
   ```bash
   npm install --save-dev hardhat
   npx hardhat init
Choose "Create a basic sample project" and follow the prompts.
Configure Hardhat:
Update hardhat.config.js to include the Sepolia network:
js

Collapse

Wrap

Copy
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
Create a .env file in the project root:
env

Collapse

Wrap

Copy
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your-private-key-here
Install dotenv:
bash

Collapse

Wrap

Copy
npm install dotenv
Note: Never share your private key. Use a test wallet for this purpose.
Deploy the Contract:
Create a deployment script in scripts/deploy.js:
js

Collapse

Wrap

Copy
const hre = require("hardhat");

async function main() {
  const TaskManager = await hre.ethers.getContractFactory("TaskManager");
  const taskManager = await TaskManager.deploy();

  await taskManager.deployed();
  console.log("TaskManager deployed to:", taskManager.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
Deploy to Sepolia:
bash

Collapse

Wrap

Copy
npx hardhat run scripts/deploy.js --network sepolia
Note the deployed contract address (e.g., 0xYourNewAddress).
Update the contractAddress in src/App.js:
jsx

Collapse

Wrap

Copy
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0xYourNewAddress";
Update ABI:
After deployment, Hardhat will generate the ABI in artifacts/contracts/TaskManager.sol/TaskManager.json.
Copy the abi field into src/TaskManagerABI.json.
2. Frontend Setup
Clone the Repository:
bash

Collapse

Wrap

Copy
git clone https://github.com/Subbu-chowdary/Task-manager-blockchain.git
cd Task-manager-blockchain
Install Dependencies:
bash

Collapse

Wrap

Copy
npm install
Set Up Environment Variables:
Create a .env file in the project root.
Add the contract address:
env

Collapse

Wrap

Copy
REACT_APP_CONTRACT_ADDRESS=0x147f355376bf85c83721cedb6a552d4103f5fe2c
Replace the address with your deployed contract address if different.
Start the App Locally:
bash

Collapse

Wrap

Copy
npm start
The app will run at http://localhost:3000.
Features
Wallet-based login with MetaMask (no signup required).
Create, update, delete, and drag-and-drop tasks on the blockchain.
Dark mode toggle with a sliding animation.
Responsive UI styled with Tailwind CSS.
Task order persistence using localStorage (persists across refreshes in the same browser).
ABI
The ABI is stored in src/TaskManagerABI.json.
Update it with the compiled ABI from your deployment if you redeploy the contract.

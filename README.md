# Blockchain Task Manager

A decentralized task manager built on Ethereum/Polygon using Solidity and React.

## Setup

1. **Contract Deployment**:

   - Install Hardhat: `npm install --save-dev hardhat`
   - Configure `hardhat.config.js` with your Mumbai network URL and private key.
   - Deploy: `npx hardhat run scripts/deploy.js --network mumbai`
   - Update `contractAddress` in `src/App.js` with the deployed address.

2. **Frontend Setup**:
   - Clone the repo: `git clone <repo-url>`
   - Install dependencies: `npm install`
   - Start the app: `npm start`

## Features

- Wallet-based login/signup with MetaMask
- Create, update, delete, and drag-and-drop tasks
- Dark mode toggle
- Responsive UI with Material-UI

## ABI

- ABI is stored in `src/TaskManagerABI.json`. Update it with the compiled ABI from your deployment.

## Deployment

- Contract: Deployed to Mumbai testnet
- Frontend: Deploy to Vercel/Netlify with `npm run build`

## Testing

- Run tests: `npm test`

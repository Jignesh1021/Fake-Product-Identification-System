# HashNity - Web3 Product Authentication System

This document outlines the complete architectural functionality, stack, and operational procedures for this hybrid Web2/Web3 application.

## 📝 1. Project Overview
The project is a decentralized application (dApp) designed to combat counterfeiting through cryptographic product registration. When a manufacturer registers a new product, its physical characteristics are combined to create an immutable **SHA-256 hash**, which is then anchored to an Ethereum-compatible blockchain via a smart contract. 

## 🏗 2. Tech Stack Architecture

The application is vertically split into three distinct modules:

### A. Frontend (React.js)
* **Directory**: `/frontend`
* **Port**: `http://localhost:3000`
* **Core Libraries**: React Router, Framer Motion, Axios, Ethers.js
* **Responsibilities**: 
  - Provides a beautiful Dark/Cyberpunk UI interface.
  - Manages Manufacturer Google OAuth logins.
  - Generates downloadable Cryptographic QR Codes for registered products.
  - **Wallet Integration**: Integrates directly with the MetaMask browser extension. By passing the backend to directly interact with the Hardhat smart contracts, manufacturers pay Gas and cryptographically sign product creation with their own private keys.

### B. Backend API (Python / FastAPI)
* **Directory**: `/backend`
* **Port**: `http://localhost:8000`
* **Database**: MongoDB (`test_database` running locally on `mongodb://localhost:27017`)
* **Responsibilities**:
  - Validates Google OAuth JWT tokens (`/api/auth/google`).
  - Securely parses file uploads (product images) and saves them to `/backend/uploads`.
  - Calculates the fundamental `product_hash` and generates a pseudo-unique UUID.
  - Serves as the caching and metadata layer so the application doesn't have to query the blockchain for every tiny string or layout text.

### C. Smart Contracts (Solidity & Hardhat)
* **Directory**: `/contracts`
* **Network**: Localhost (`http://127.0.0.1:8545` | Chain ID: `1337`)
* **Contract Name**: `ProductRegistry`
* **Deployed Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (Default Hardhat node deployment)
* **Responsibilities**:
  - The absolute source of truth.
  - Functions: `registerProduct` (mints the item), `checkRegistration` (validates existence), and `getScanCount` (proves historical scans).

---

## ⚙️ 3. Execution / Start-up Instructions

To run the entire system end-to-end, you must boot up all four servers/services:

### 1. Start MongoDB (Database)
Ensure your MongoDB Community Server Windows Service is running. It must be active on `mongodb://localhost:27017` to accept the Python server's connection.

### 2. Start the Blockchain (Hardhat)
```bash
cd contracts
npx hardhat node
```
*This starts the local Ethereum sandbox network, gives you 20 loaded accounts, and deplons the `ProductRegistry.sol` contract automatically.*

### 3. Start the Backend API (Python)
```bash
cd backend
# Make sure your virtual environment is active if you use one
python server.py
```
*This spins up the FastAPI server, connecting to MongoDB and opening port 8000.*

### 4. Start the Frontend Application (React)
```bash
cd frontend
npm start
```
*This launches the React development server.*

---

## 🔒 4. Environment Variables Reference

Here are the required contents of the `.env` files powering the system:

**`frontend/.env`**
```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=853344548848-6l8kgn577sb788iovtoqmmbbnkpoqrke.apps.googleusercontent.com
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**`backend/.env`**
```env
# MongoDB Connection 
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"

# Google Auth
GOOGLE_CLIENT_ID="853344548848-6l8kgn577sb788iovtoqmmbbnkpoqrke.apps.googleusercontent.com"

# Blockchain Defaults
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"
BLOCKCHAIN_CHAIN_ID=1337
BLOCKCHAIN_REGISTRY_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

## 🚀 5. Core User Flows

**A. Logging In**
1. User clicks "Login with Google".
2. React gets Google JWT Token -> Sends to `/api/auth/google`.
3. Python verifies Token Signature and logs user into MongoDB session.

**B. Product Registration (Web3)**
1. User enters Details & Image -> Clicks "Register".
2. If wallet isn't connected, React pauses and triggers MetaMask `eth_requestAccounts`.
3. React passes Image/Text to Python. Python saves image to `/uploads` and creates MongoDB Doc. Python answers back with just the `hash`.
4. React injects `ethers.js` via the user's active MetaMask Account.
5. MetaMask pops up requiring Gas signature. User signs. 
6. `registerProduct` triggers on the Hardhat node. Registration is complete.

**C. Verification & Product Query**
1. Scanning a QR code takes the user to `/product/{id}`.
2. React pulls standard metadata info from Python/MongoDB.
3. React concurrently calls the `ProductRegistry` smart contract locally using an `ethers.JsonRpcProvider` to verify the ID officially exists `checkRegistration()`.
4. UI displays verified status strictly dependent on the blockchain state.

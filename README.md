# 🚀 HashNity — Web3 Product Authentication System

HashNity is a decentralized application (dApp) designed to combat counterfeit products using **blockchain technology, SHA-256 hashing, and QR-based verification**.

---

## 🧠 Project Overview

HashNity allows manufacturers to register products securely on the blockchain. Each product is assigned a unique cryptographic hash and QR code, enabling real-time authenticity verification.

---

## 🏗️ Tech Stack

### 🔹 Frontend

* React.js
* Tailwind CSS
* Axios, Ethers.js
* MetaMask Integration

### 🔹 Backend

* FastAPI (Python)
* MongoDB
* Google OAuth Authentication

### 🔹 Blockchain

* Solidity Smart Contracts
* Hardhat
* Ethers.js

---

## 🔐 Features

* ✔ Blockchain-based product registration
* ✔ SHA-256 hash identity
* ✔ QR code verification
* ✔ MetaMask wallet integration
* ✔ Google login system
* ✔ Fake product detection

---

## ⚙️ Setup Instructions

### 1. Start MongoDB

```
mongodb://localhost:27017
```

### 2. Start Blockchain

```bash
cd contracts
npx hardhat node
```

### 3. Start Backend

```bash
cd backend
python server.py
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🔒 Environment Variables

⚠️ Do NOT upload `.env` files to GitHub

### frontend/.env

```
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_CONTRACT_ADDRESS=your_contract_address
```

### backend/.env

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database

GOOGLE_CLIENT_ID=your_client_id

BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=1337
BLOCKCHAIN_REGISTRY_ADDRESS=your_contract_address
```

---

## 🚀 Future Improvements

* Batch system for product grouping
* Dashboard analytics
* Testnet deployment (Sepolia / Polygon)
* Fake product reporting system
* API rate limiting

---

## 🏆 Highlights

* Full-stack Web3 project
* Blockchain + QR integration
* Real-world counterfeit detection system

---

## 👨‍💻 Author

**Jignesh More**
Final Year IT Student

---

⭐ Star this repo if you like it!

# HashNity Smart Contracts

## ProductRegistry Contract

A Solidity smart contract for storing and verifying product authenticity on the blockchain.

### Features
- Register products by hash
- Track product registrations
- Record product scans/verifications
- Query product status and scan counts
- Immutable on-chain records

### Contract Functions

#### `registerProduct(bytes32 _productHash, string _productId, string _manufacturerId)`
Register a new product on the blockchain.

#### `recordScan(bytes32 _productHash)`
Record a scan/verification of a product.

#### `checkRegistration(bytes32 _productHash) → bool`
Check if a product is registered.

#### `getProduct(bytes32 _productHash) → Product`
Get product details.

#### `getScanCount(bytes32 _productHash) → uint256`
Get the number of times a product has been scanned.

---

## Deployment Guide

### Prerequisites
1. Node.js and npm installed
2. Private key with testnet/mainnet funds
3. RPC endpoint (Alchemy, Infura, QuickNode, etc.)

### 1. Setup

```bash
cd contracts
npm install
```

### 2. Environment Variables

Create a `.env` file in the `contracts` directory:

```
# For Polygon Amoy (Testnet)
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
DEPLOYMENT_PRIVATE_KEY=your_private_key_here

# For Polygon PoS (Mainnet)
POLYGON_RPC_URL=https://polygon-rpc.com

# For block explorer verification (optional)
ETHERSCAN_API_KEY=your_polygonscan_api_key
```

⚠️ **NEVER commit the `.env` file or share your private key!**

### 3. Deploy to Polygon Amoy (Testnet)

```bash
npm run deploy:amoy
```

### 4. Deploy to Polygon PoS (Mainnet)

```bash
npm run deploy:polygon
```

### 5. Update Backend

After deployment, copy the contract address and update `backend/.env`:

```
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_REGISTRY_ADDRESS=0x...  # Copy from deployment output
BLOCKCHAIN_PRIVATE_KEY=your_server_wallet_key
BLOCKCHAIN_CHAIN_ID=80002  # 80002 for Amoy, 137 for Polygon PoS
```

Then restart the backend:

```bash
cd backend
pip install -r requirements.txt
python server.py
```

---

## Testing

To test the contract locally:

```bash
npx hardhat test
```

---

## Verification on Block Explorer

The deployment script automatically verifies your contract if `ETHERSCAN_API_KEY` is set.

Or manually verify:

```bash
npx hardhat verify --network amoy 0xYourContractAddress
```

---

## Network Details

### Polygon Amoy (Testnet)
- **Chain ID**: 80002
- **RPC**: https://rpc-amoy.polygon.technology
- **Faucet**: https://faucet.polygon.technology/
- **Explorer**: https://amoy.polygonscan.com

### Polygon PoS (Mainnet)
- **Chain ID**: 137
- **RPC**: https://polygon-rpc.com
- **Explorer**: https://polygonscan.com

---

## Gas Optimization

The contract uses the following optimizations:
- Solidity 0.8.20 (latest features)
- Optimizer enabled with 200 runs
- Efficient data structures (mappings for O(1) lookups)

---

## Security Considerations

- ✅ No external calls (no reentrancy risk)
- ✅ Simple state management
- ✅ Access control via msg.sender for manufacturer verification
- ⚠️ Public registration (anyone can register products)

For production, consider:
- Adding manufacturer whitelisting
- Implementing more granular access control
- Adding metadata hashing for tamper detection

---

## Support

For issues or questions, refer to:
- Polygon Docs: https://polygon.technology/developers
- Hardhat Docs: https://hardhat.org
- Solidity Docs: https://docs.soliditylang.org

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ProductRegistry contract...");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`📍 Deploying from: ${signer.address}`);

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (chainId: ${network.chainId})`);

  // Deploy contract
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy();

  await productRegistry.waitForDeployment();

  const contractAddress = await productRegistry.getAddress();
  console.log(`✅ ProductRegistry deployed to: ${contractAddress}`);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: signer.address,
    chainId: network.chainId.toString(),
    network: network.name,
    blockNumber: (await hre.ethers.provider.getBlockNumber()).toString(),
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`📝 Deployment info saved to: ${deploymentFile}`);
  console.log("\n📋 Environment variables to set:");
  console.log(`BLOCKCHAIN_REGISTRY_ADDRESS=${contractAddress}`);
  console.log(`BLOCKCHAIN_CHAIN_ID=${network.chainId}`);

  // Verify contract on block explorer (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    await productRegistry.deploymentTransaction().wait(5);

    console.log("🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed or already verified:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

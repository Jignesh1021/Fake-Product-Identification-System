// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProductRegistry
 * @dev A simple registry for blockchain-based product verification
 * Stores product hashes and tracks registrations/scans
 */
contract ProductRegistry {
    
    struct Product {
        bytes32 productHash;
        string productId;
        address manufacturer;
        uint256 registeredAt;
        uint256 scanCount;
    }

    // Mapping of productHash to Product
    mapping(bytes32 => Product) public products;
    mapping(bytes32 => bool) public isRegistered;
    mapping(bytes32 => bool) public isScanned;

    // Events
    event ProductRegistered(
        bytes32 indexed productHash,
        address indexed manufacturer,
        string productId,
        uint256 timestamp
    );

    event ProductScanned(
        bytes32 indexed productHash,
        uint256 scanCount,
        uint256 timestamp
    );

    /**
     * @dev Register a new product on the blockchain
     * @param _productHash SHA-256 hash of product data
     * @param _productId Unique product ID
     * @param _manufacturerId Manufacturer ID for reference
     */
    function registerProduct(
        bytes32 _productHash,
        string memory _productId,
        string memory _manufacturerId
    ) external {
        require(_productHash != bytes32(0), "Invalid product hash");
        require(!isRegistered[_productHash], "Product already registered");
        require(bytes(_productId).length > 0, "Invalid product ID");

        products[_productHash] = Product({
            productHash: _productHash,
            productId: _productId,
            manufacturer: msg.sender,
            registeredAt: block.timestamp,
            scanCount: 0
        });

        isRegistered[_productHash] = true;

        emit ProductRegistered(_productHash, msg.sender, _productId, block.timestamp);
    }

    /**
     * @dev Record a scan/verification of a product
     * @param _productHash SHA-256 hash of product data
     */
    function recordScan(bytes32 _productHash) external {
        require(isRegistered[_productHash], "Product not registered");

        Product storage product = products[_productHash];
        product.scanCount += 1;
        isScanned[_productHash] = true;

        emit ProductScanned(_productHash, product.scanCount, block.timestamp);
    }

    /**
     * @dev Check if a product is registered
     * @param _productHash SHA-256 hash of product data
     * @return True if product is registered
     */
    function checkRegistration(bytes32 _productHash) external view returns (bool) {
        return isRegistered[_productHash];
    }

    /**
     * @dev Get product details
     * @param _productHash SHA-256 hash of product data
     * @return Product struct
     */
    function getProduct(bytes32 _productHash) 
        external 
        view 
        returns (Product memory) 
    {
        require(isRegistered[_productHash], "Product not found");
        return products[_productHash];
    }

    /**
     * @dev Get scan count for a product
     * @param _productHash SHA-256 hash of product data
     * @return Number of times product has been scanned
     */
    function getScanCount(bytes32 _productHash) 
        external 
        view 
        returns (uint256) 
    {
        require(isRegistered[_productHash], "Product not found");
        return products[_productHash].scanCount;
    }
}

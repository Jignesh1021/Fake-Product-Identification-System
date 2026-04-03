import os
import logging
from functools import lru_cache
from typing import Optional
from web3 import Web3
from eth_account import Account
from web3.exceptions import ContractLogicError

logger = logging.getLogger(__name__)

REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "productHash", "type": "bytes32"},
            {"internalType": "string", "name": "productId", "type": "string"},
            {"internalType": "string", "name": "manufacturerId", "type": "string"},
        ],
        "name": "registerProduct",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "productHash", "type": "bytes32"}],
        "name": "isRegistered",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "bytes32", "name": "productHash", "type": "bytes32"},
            {"indexed": True, "internalType": "address", "name": "manufacturer", "type": "address"},
            {"indexed": False, "internalType": "string", "name": "productId", "type": "string"},
        ],
        "name": "ProductRegistered",
        "type": "event",
    },
]


@lru_cache(maxsize=1)
def _get_config():
    return {
        "rpc_url": os.environ.get("BLOCKCHAIN_RPC_URL"),
        "registry_address": os.environ.get("BLOCKCHAIN_REGISTRY_ADDRESS"),
        "private_key": os.environ.get("BLOCKCHAIN_PRIVATE_KEY"),
        "chain_id": os.environ.get("BLOCKCHAIN_CHAIN_ID"),
    }


def _get_web3():
    cfg = _get_config()
    if not cfg["rpc_url"] or not cfg["registry_address"] or not cfg["private_key"]:
        return None, cfg
    try:
        w3 = Web3(Web3.HTTPProvider(cfg["rpc_url"]))
        if not w3.is_connected():
            logger.error("Web3 not connected to RPC")
            return None, cfg
        return w3, cfg
    except Exception as exc:  # pragma: no cover
        logger.error(f"Web3 init failed: {exc}")
        return None, cfg


def _to_bytes32(hex_str: str) -> bytes:
    # product_hash is hex without 0x
    return bytes.fromhex(hex_str)


def is_product_registered_on_chain(product_hash: str) -> Optional[bool]:
    w3, cfg = _get_web3()
    if not w3:
        return None
    try:
        contract = w3.eth.contract(address=w3.to_checksum_address(cfg["registry_address"]), abi=REGISTRY_ABI)
        return contract.functions.isRegistered(_to_bytes32(product_hash)).call()
    except ContractLogicError as exc:  # pragma: no cover
        logger.warning(f"Chain call reverted: {exc}")
        return None
    except Exception as exc:  # pragma: no cover
        logger.error(f"Chain check failed: {exc}")
        return None


def register_product_on_chain(product_hash: str, product_id: str, manufacturer_id: str) -> Optional[str]:
    w3, cfg = _get_web3()
    if not w3:
        return None
    try:
        account = Account.from_key(cfg["private_key"])
        contract = w3.eth.contract(address=w3.to_checksum_address(cfg["registry_address"]), abi=REGISTRY_ABI)
        nonce = w3.eth.get_transaction_count(account.address)
        tx = contract.functions.registerProduct(
            _to_bytes32(product_hash), product_id, manufacturer_id
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": int(cfg["chain_id"]) if cfg.get("chain_id") else w3.eth.chain_id,
            "gas": 300000,
            "maxFeePerGas": w3.to_wei("35", "gwei"),
            "maxPriorityFeePerGas": w3.to_wei("1", "gwei"),
        })
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()
    except Exception as exc:  # pragma: no cover
        logger.error(f"Chain register failed: {exc}")
        return None

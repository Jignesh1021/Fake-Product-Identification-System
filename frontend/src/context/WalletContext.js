import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      setIsMetamaskInstalled(true);
      
      // Look for an already authorized account
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          }
        })
        .catch(console.error);

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setSigner(null);
      return null;
    } else {
      setAccount(accounts[0]);
      return await setupEthers();
    }
  };

  const handleChainChanged = (_chainId) => {
    // We recommend reloading the page, unless you must do otherwise
    window.location.reload();
  };

  const setupEthers = async () => {
    if (window.ethereum) {
      // Setup Web3 provider using ethers v6 standard
      const _provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(_provider);
      
      const _signer = await _provider.getSigner();
      setSigner(_signer);
      
      const network = await _provider.getNetwork();
      setChainId(network.chainId.toString());
      return { provider: _provider, signer: _signer };
    }
    return null;
  };

  const connectWallet = async () => {
    if (!isMetamaskInstalled) {
      alert("Please install MetaMask to proceed. Go to metamask.io");
      return null;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const result = await handleAccountsChanged(accounts);
      return result ? { account: accounts[0], signer: result.signer } : null;
    } catch (error) {
      console.error("User rejected wallet connection request.", error);
      return null;
    }
  };

  const disconnectWallet = () => {
    // MetaMask doesn't have a direct 'disconnect' prompt, but we clear our UI state.
    setAccount(null);
    setSigner(null);
  };

  return (
    <WalletContext.Provider value={{
      account,
      provider,
      signer,
      chainId,
      isMetamaskInstalled,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);

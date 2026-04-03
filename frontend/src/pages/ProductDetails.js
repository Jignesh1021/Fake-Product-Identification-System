import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Package, Calendar, Hash, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useWallet } from '@/context/WalletContext';
import { ethers } from 'ethers';
import ProductRegistryArtifact from '@/lib/ProductRegistry.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductDetails() {
  const { productId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onChainScans, setOnChainScans] = useState(null);
  const [isOnChain, setIsOnChain] = useState(false);
  const { provider } = useWallet();

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      const [productRes, historyRes] = await Promise.all([
        axios.get(`${API}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/products/${productId}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const productResRaw = productRes.data;
      setProduct(productResRaw);
      setHistory(historyRes.data);

      // Web3 verification
      try {
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        // To read data, we don't need a signer, just a provider
        const rpcProvider = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const contract = new ethers.Contract(contractAddress, ProductRegistryArtifact.abi, rpcProvider);
        
        const hashFormat = "0x" + productResRaw.product_hash;
        const isRegistered = await contract.checkRegistration(hashFormat);
        setIsOnChain(isRegistered);

        if (isRegistered) {
          const scans = await contract.getScanCount(hashFormat);
          setOnChainScans(Number(scans));
        }
      } catch (blockchainErr) {
        console.log("Blockchain sync error:", blockchainErr);
      }
      
    } catch (error) {
      console.error('Error fetching product data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('product-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${product.name}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-zinc-700 border-t-[#f59e0b] rounded-full animate-spin mb-4" />
          <p className="text-zinc-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Product not found</p>
          <Button onClick={() => navigate('/dashboard')} data-testid="back-dashboard-button">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="text-zinc-400 hover:text-white mb-6"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-sm" data-testid="product-details">
              <h1 className="text-3xl font-bold heading text-white mb-6">{product.name}</h1>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-white">{product.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Category</p>
                    <p className="text-white font-medium">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Batch Number</p>
                    <p className="text-white font-medium mono">{product.batch_number}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Manufacturing Date</p>
                  <p className="text-white font-medium">{product.manufacturing_date}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Product ID</p>
                  <p className="text-white mono text-sm break-all">{product.id}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Product Hash (SHA-256)</p>
                  <p className="text-white mono text-xs break-all bg-zinc-950 p-3 rounded">
                    {product.product_hash}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Total DB Scans</p>
                    <p className="text-3xl font-bold mono text-[#f59e0b]">{product.verification_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">On-Chain Scans</p>
                    <p className="text-3xl font-bold mono text-fuchsia-500">{onChainScans !== null ? onChainScans : '--'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1 mt-4">Registration Date</p>
                    <p className="text-white text-sm">{formatDate(product.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-sm" data-testid="verification-history">
              <div className="flex items-center space-x-3 mb-6">
                <Activity className="w-6 h-6 text-[#f59e0b]" />
                <h2 className="text-2xl font-bold heading text-white">Verification History</h2>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500">No verifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between items-center bg-zinc-950 p-4 rounded border border-zinc-800"
                      data-testid={`history-item-${record.id}`}
                    >
                      <div>
                        <p className="text-white font-medium capitalize">{record.status.replace('_', ' ')}</p>
                        <p className="text-sm text-zinc-500 mono">{formatDate(record.timestamp)}</p>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          record.status === 'genuine'
                            ? 'bg-[#00E676]'
                            : record.status === 'already_scanned'
                            ? 'bg-[#FF9800]'
                            : 'bg-[#FF1744]'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-sm" data-testid="qr-code-card">
              <h3 className="text-lg font-bold heading text-black mb-4 text-center">Product QR Code</h3>
              <div className="flex justify-center">
                <QRCodeSVG
                  id="product-qr-code"
                  value={product.id}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <Button
                onClick={downloadQRCode}
                className="w-full mt-4 bg-black text-white hover:bg-gray-800 font-bold py-3 uppercase tracking-wider text-sm rounded-sm"
                data-testid="download-button"
              >
                Download QR Code
              </Button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-[#f59e0b]" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Manufacturer</p>
                    <p className="text-white font-medium">{product.manufacturer_company}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className={`w-5 h-5 ${isOnChain ? 'text-[#00E676]' : 'text-zinc-600'}`} />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Blockchain Status</p>
                    <p className={`${isOnChain ? 'text-[#00E676]' : 'text-zinc-500'} font-medium`}>
                      {isOnChain ? 'Verified On-Chain' : 'Not Found on Chain'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

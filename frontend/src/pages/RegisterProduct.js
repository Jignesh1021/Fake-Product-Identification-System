import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Package,
  Hash,
  Tag,
  FileText,
  Camera,
  Upload,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getErrorMessage } from '@/utils/error';
import { useWallet } from '@/context/WalletContext';
import { ethers } from 'ethers';
import ProductRegistryArtifact from '@/lib/ProductRegistry.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RegisterProduct() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    batch_number: '',
    category: '',
    description: '',
    manufacturing_date: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { account, signer, connectWallet } = useWallet();

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let currentSigner = signer;
    let currentAccount = account;
    
    if (!currentAccount || !currentSigner) {
        setLoadingText('Connecting MetaMask...');
        setLoading(true);
        const result = await connectWallet();
        if (!result || !result.signer) {
            setError('Please connect your MetaMask wallet to register the product!');
            setLoading(false);
            return;
        }
        currentSigner = result.signer;
        currentAccount = result.account;
    }
    
    setLoading(true);
    setLoadingText('Saving details to Database...');
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('batch_number', formData.batch_number);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('manufacturing_date', formData.manufacturing_date);
      if (image) {
        data.append('image', image);
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/products/register`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      const productResult = response.data;
      
      setLoadingText('Asking MetaMask for signature...');
      
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      const contract = new ethers.Contract(contractAddress, ProductRegistryArtifact.abi, currentSigner);
      
      const hashFormat = "0x" + productResult.product_hash;
      const tx = await contract.registerProduct(hashFormat, productResult.id, productResult.manufacturer_id || productResult.id);
      
      setLoadingText('Minting on Blockchain...');
      await tx.wait(); // Wait for 1 block confirmation

      setResult(productResult);
    } catch (err) {
      setError(getErrorMessage(err) || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full"
        >
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                <CheckCircle className="w-10 h-10 text-cyan-500" />
              </div>
            </div>

            <div className="mb-12">
              <h1 className="text-5xl font-black heading-gradient tracking-tighter">Mint to Ledger</h1>
              <p className="text-zinc-500 text-lg max-w-sm mx-auto">Digitize your physical asset with cryptographic proof on the blockchain.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="p-8 glass-card border-cyan-500/10 bg-cyan-500/[0.02]">
                  <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-6">Ledger Details</h3>
                  <div className="space-y-6">
                    <DetailItem label="Asset Name" value={result.name} />
                    <DetailItem label="Unique ID" value={result.id} mono />
                    <DetailItem label="Batch ID" value={result.batch_number} mono />
                    <DetailItem label="Timestamp" value={new Date().toLocaleDateString()} />
                  </div>
                </div>

                {result.image_url && (
                  <div className="rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                    <img
                      src={`${BACKEND_URL}${result.image_url}`}
                      alt=""
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center p-12 glass rounded-[40px] border-white/5 space-y-8">
                <div className="bg-white p-8 rounded-[32px] shadow-[0_0_60px_rgba(255,255,255,0.1)]">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/${result.id}`}
                    size={240}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white uppercase tracking-widest mb-2">Cryptographic QR Identity</p>
                  <p className="text-xs text-zinc-500 max-w-[200px]">Scan this code to verify product authenticity from any device.</p>
                </div>
                <div className="flex gap-4 w-full">
                  <Button onClick={() => window.print()} variant="outline" className="flex-1 rounded-xl h-12 border-white/10 hover:bg-white/5">
                    Print Label
                  </Button>
                  <Button onClick={() => navigate('/dashboard')} className="flex-1 btn-primary h-12 rounded-xl">
                    Return Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <nav className="p-8 group cursor-pointer inline-flex items-center space-x-3" onClick={() => navigate('/dashboard')}>
        <div className="p-2 glass rounded-lg group-hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white" />
        </div>
        <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest font-plus">Back to Terminal</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-16">
          <h1 className="text-6xl font-extrabold heading-gradient tracking-tighter mb-4">Register Asset</h1>
          <p className="text-xl text-zinc-500">Initialize a new product entry in the HashNity registry.</p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup icon={Package} label="Product Name" name="name" value={formData.name} onChange={handleChange} required placeholder="Limited Edition NFT Watch" />
                <InputGroup icon={Hash} label="Batch ID" name="batch_number" value={formData.batch_number} onChange={handleChange} required placeholder="B-2026-XF-01" />
                <InputGroup icon={FileText} label="Manufacturing Date" name="manufacturing_date" type="date" value={formData.manufacturing_date} onChange={handleChange} required />
              </div>
              <InputGroup icon={Tag} label="Asset Category" name="category" value={formData.category} onChange={handleChange} required placeholder="Luxury Goods / Apparel" />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Metadata Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="glass-input w-full h-auto py-4 resize-none"
                  placeholder="Enter detailed immutable metadata for this asset..."
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-16 text-lg rounded-2xl group"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  <span>{loadingText}</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  Confirm & Mint Asset
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              )}
            </Button>
            {error && <p className="text-red-400 text-sm text-center bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>}
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Visual Identity
              </h3>
              <div
                className={`group relative aspect-square rounded-[32px] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${imagePreview ? 'border-fuchsia-500/50' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                  }`}
                onClick={() => document.getElementById('image-upload').click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-zinc-600 group-hover:text-fuchsia-500" />
                    </div>
                    <p className="text-sm font-bold text-zinc-500">Upload Image</p>
                    <p className="text-[10px] text-zinc-700 mt-2 uppercase tracking-tighter">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  name="image"
                  onChange={handleChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border-fuchsia-500/5 space-y-4">
              <div className="flex items-center space-x-3 text-fuchsia-500">
                <Shield className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Assurance</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed italic">
                "By committing this data, you acknowledge that all metadata will be hashed and permanently stored on the distributed ledger. This action is irreversible."
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function InputGroup({ icon: Icon, label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-white/5 border border-white/5 transition-all group-focus-within:border-fuchsia-500/30 group-focus-within:bg-fuchsia-500/10">
          <Icon className="w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-fuchsia-500" />
        </div>
        <input
          {...props}
          className="glass-input w-full pl-14"
        />
      </div>
    </div>
  );
}

function DetailItem({ label, value, mono }) {
  return (
    <div className="flex justify-between items-end border-b border-white/5 pb-2">
      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-bold text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

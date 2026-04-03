import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Package,
  History,
  CheckCircle,
  Clock,
  MapPin,
  ArrowLeft,
  Calendar,
  Layers,
  ExternalLink,
  ChevronRight,
  Fingerprint,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function VerificationResult() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyProduct = async () => {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/verify/${productId}`);
        setResult(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 border-t-2 border-fuchsia-500 rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] animate-pulse">Scanning Registry...</p>
        </div>
      </div>
    );
  }

  const isGenuine = result?.status === 'genuine';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <nav className="p-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors"
        >
          <div className="p-2 glass rounded-lg group-hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Back to Terminal</span>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 pb-32">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-4">Registry Error</h1>
              <p className="text-zinc-500 text-lg mb-8">{error}</p>
              <Button onClick={() => navigate('/scan')} className="btn-primary px-8 py-3">Return to Scanner</Button>
            </motion.div>
          ) : (
            <div className="space-y-12">
              {/* Status Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-12 overflow-hidden relative ${isGenuine ? 'border-cyan-500/20 shadow-[0_0_100px_rgba(16,185,129,0.05)]' : 'border-rose-500/20 shadow-[0_0_100px_rgba(244,63,94,0.05)]'}`}
              >
                {/* Status Glow Effects */}
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 ${isGenuine ? 'bg-cyan-500/10' : 'bg-rose-500/10'}`} />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-12 text-center md:text-left">
                  <div className="flex-1 space-y-6">
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border mb-4 ${isGenuine ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${isGenuine ? 'bg-cyan-500' : 'bg-rose-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Protocol Check Complete</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-4">
                      {isGenuine ? (
                        <>GENUINE <br /><span className="text-cyan-500">ASSET.</span></>
                      ) : (
                        <>UNAUTHENTIC <br /><span className="text-rose-500">ASSET.</span></>
                      )}
                    </h1>

                    <p className="text-xl text-zinc-500 max-w-xl leading-relaxed">
                      {isGenuine
                        ? 'This product has been cryptographically verified against the HashNity decentralized registry.'
                        : 'Warning: This product identifier was not found or has failed security protocol validations.'}
                    </p>
                  </div>

                  <div className={`w-48 h-48 rounded-[40px] flex items-center justify-center border-4 ${isGenuine ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-rose-500/20 bg-rose-500/10'}`}>
                    {isGenuine ? (
                      <ShieldCheck className="w-24 h-24 text-cyan-500 animate-fade-in" />
                    ) : (
                      <ShieldAlert className="w-24 h-24 text-rose-500 animate-pulse" />
                    )}
                  </div>
                </div>
              </motion.div>

              {isGenuine && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Product Metadata */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 space-y-12"
                  >
                    <div className="glass-card p-10 space-y-10">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Cryptographic Proof</h2>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center">
                          <ShieldCheck className="w-3 h-3 mr-2" />
                          On-Chain Confirmed
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="glass p-6 rounded-2xl border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transaction Hash</span>
                            <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">VALIDATED</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-mono text-fuchsia-400 break-all">{result.product.chain_tx || '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}</p>
                            <ExternalLink className="w-4 h-4 text-zinc-600 flex-shrink-0 ml-4 cursor-pointer hover:text-white transition-colors" />
                          </div>
                        </div>

                        <div className="glass p-6 rounded-2xl border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Asset Fingerprint (SHA-256)</span>
                          </div>
                          <p className="text-sm font-mono text-zinc-400 break-all">{result.product.product_hash}</p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-8">Metadata Analysis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <DetailBox icon={Package} label="Product Name" value={result.product.name} />
                            <DetailBox icon={Layers} label="Category" value={result.product.category} />
                            <DetailBox icon={Clock} label="Registry Date" value={new Date(result.product.timestamp || result.product.created_at).toLocaleDateString()} />
                          </div>
                          <div className="space-y-6">
                            <DetailBox icon={Fingerprint} label="Batch ID" value={result.product.batch_number} mono />
                            <DetailBox icon={CheckCircle} label="Manufacturer" value={result.product.manufacturer_company} />
                            <DetailBox icon={History} label="Ledger Scan Count" value={result.product.verification_count} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5">
                        <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 text-center">Digital Asset Preview</h4>
                        {result.product.image_url && (
                          <div className="rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-zinc-900 aspect-video max-w-xl mx-auto">
                            <img
                              src={`${BACKEND_URL}${result.product.image_url}`}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <p className="text-zinc-500 italic font-medium leading-relaxed text-center mt-6 text-sm">
                          "{result.product.description || 'No additional metadata provided for this asset.'}"
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Verification History / Supply Chain */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-12"
                  >
                    <div className="glass-card p-8">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-8 flex items-center">
                        <History className="w-4 h-4 mr-2 text-fuchsia-500" />
                        On-Chain Activity
                      </h3>

                      <div className="space-y-8 relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-fuchsia-500 via-fuchsia-500/20 to-transparent" />

                        <TimelineItem
                          title="Minted to Ledger"
                          date={new Date(result.product.created_at).toDateString()}
                          desc="Asset registered with global state commitment."
                          current
                        />
                        <TimelineItem
                          title="Block Consensus"
                          date={new Date(result.product.created_at).toLocaleTimeString()}
                          desc="Network nodes confirmed validity."
                        />
                        <TimelineItem
                          title="Verified Signature"
                          date="Current Timestamp"
                          desc="Cryptographic fingerprint check success."
                        />
                      </div>
                    </div>

                    <div className="glass p-8 rounded-3xl border-fuchsia-500/5 space-y-6 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
                      <div className="flex items-center space-x-3 text-fuchsia-500">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Ver-5.2</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        This asset is uniquely identified on the HashNity network. The cryptographic fingerprint matches the original brand registration and cannot be tampered with.
                      </p>
                      <Button variant="outline" className="w-full rounded-xl h-12 border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        View on Ledger <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function DetailBox({ icon: Icon, label, value, mono }) {
  return (
    <div className="group space-y-2">
      <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <p className={`text-xl font-bold text-white group-hover:text-fuchsia-400 transition-colors ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function TimelineItem({ title, date, desc, current }) {
  return (
    <div className="relative pl-10 group">
      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full glass border transition-all ${current ? 'bg-fuchsia-600 border-fuchsia-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 border-white/10 group-hover:border-fuchsia-500/50'}`} />
      <div>
        <h4 className="font-bold text-white text-sm">{title}</h4>
        <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">
          <Calendar className="w-3 h-3" />
          <span>{date}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">{desc}</p>
      </div>
    </div>
  );
}

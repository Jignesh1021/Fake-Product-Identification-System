import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  QrCode,
  Camera,
  AlertCircle,
  ArrowLeft,
  Maximize2,
  Zap,
  History,
  CheckCircle,
  Layout,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getErrorMessage } from '@/utils/error';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ManufacturerScan() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualInput, setManualInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    return () => {
      if (html5QrCode) {
        try {
          html5QrCode.stop().catch(() => {}).finally(() => {
            try { html5QrCode.clear(); } catch(e) {}
          });
        } catch (error) {
          try { html5QrCode.clear(); } catch(e) {}
        }
      }
    };
  }, [user, navigate, html5QrCode]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      
      // Request permissions and get cameras
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error('No physical cameras found on this device.');
      }
      
      // Choose back camera if possible, else default to whatever is available
      const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
      const cameraId = backCamera ? backCamera.id : cameras[0].id;

      const qrCode = new Html5Qrcode("reader");
      setHtml5QrCode(qrCode);
      
      await qrCode.start(
        cameraId,
        { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
        async (decodedText) => {
          try {
            await qrCode.stop();
          } catch (e) {}
          
          let finalId = decodedText.trim();
          try {
            if (finalId.startsWith('http')) {
              const url = new URL(finalId);
              const parts = url.pathname.split('/');
              finalId = parts[parts.length - 1];
            }
          } catch(e) {}
            
          await verifyProductAsManufacturer(finalId);
        },
        (errorMessage) => { }
      );
      setScanning(true);
    } catch (error) {
      if (error?.message?.includes('devices')) {
        setCameraError('Please use HTTPS to access the camera securely.');
      } else {
        setCameraError(error?.message || String(error) || 'Permission denied or unsupported securely.');
      }
      setScanning(false);
    }
  };

  const verifyProductAsManufacturer = async (productId) => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/manufacturer/verify/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Internal Link Verified');
      navigate(`/verify/${productId}`);
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Verification Protocol Failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-fuchsia-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <nav className="p-8 relative z-10 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 glass rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(217,70,239,0.2)] transition-all group"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Authenticated Agent</span>
              <span className="text-xs font-bold text-white">{user?.company_name || user?.email}</span>
            </div>
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center border-fuchsia-500/20">
              <Shield className="w-5 h-5 text-fuchsia-500" />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="w-20 h-20 bg-fuchsia-600/10 rounded-3xl flex items-center justify-center mx-auto border border-fuchsia-500/20 fuchsia-glow">
            <QrCode className="w-10 h-10 text-fuchsia-500" />
          </div>
          <h1 className="text-5xl font-black heading-gradient tracking-tighter">Manufacturer Link</h1>
          <p className="text-zinc-500 text-lg">Initialize internal verification of physical inventory.</p>
        </motion.div>

        <div className="w-full max-w-md relative">
          <AnimatePresence mode="wait">
            {cameraError || manualInput ? (
              <motion.div
                key="manual-mode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="glass-card p-10 space-y-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                    <Maximize2 className="w-4 h-4 mr-2 text-fuchsia-500" />
                    Internal Entry
                  </h3>
                  <div className="space-y-4">
                    <div className="relative group">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter Asset Identity Hash..."
                        className="glass-input w-full p-5 font-mono text-sm"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Zap className={`w-4 h-4 transition-colors ${inputValue ? 'text-fuchsia-500' : 'text-zinc-700'}`} />
                      </div>
                    </div>
                    <Button
                      onClick={handleManualVerify}
                      disabled={loading || !inputValue}
                      className="w-full btn-primary h-14 text-base rounded-2xl"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : 'Confirm Authenticity'}
                    </Button>
                  </div>
                  {cameraError && (
                    <div className="flex items-center space-x-3 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-red-400 uppercase leading-snug">{cameraError}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setManualInput(false); setCameraError(null) }}
                    className="w-full text-xs font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors py-2"
                  >
                    Re-initialize Link
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="scanner-mode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                <div className="absolute -inset-4 border border-fuchsia-500/10 rounded-[40px] pointer-events-none" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-fuchsia-500 rounded-tl-2xl z-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-fuchsia-500 rounded-tr-2xl z-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-fuchsia-500 rounded-bl-2xl z-20 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-fuchsia-500 rounded-br-2xl z-20 pointer-events-none" />

                {scanning && (
                  <div className="absolute left-8 right-8 h-[2px] bg-fuchsia-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20 animate-scan-line pointer-events-none" />
                )}

                <div className="glass-card p-4 overflow-hidden shadow-[0_0_80px_rgba(217,70,239,0.1)] relative">
                  <div id="reader" className="w-full aspect-square rounded-3xl overflow-hidden bg-black" />
                  
                  {!scanning && (
                    <div className="absolute inset-4 rounded-3xl bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-10 border border-fuchsia-500/10">
                      <Video className="w-16 h-16 text-fuchsia-500 mb-6 fuchsia-glow" />
                      <h4 className="text-white font-bold text-lg mb-2">Sensor Offline</h4>
                      <p className="text-zinc-400 text-sm mb-8 text-center">Tap below to establish a secure link with your optical device.</p>
                      <Button onClick={startScanner} className="btn-primary w-full max-w-xs h-14 text-base">Initialize Lens</Button>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setManualInput(true)}
                    className="flex items-center space-x-3 p-4 glass rounded-2xl hover:bg-white/10 transition-all group border-white/5"
                  >
                    <Maximize2 className="w-5 h-5 text-zinc-500 group-hover:text-fuchsia-500 transition-colors" />
                    <span className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-300 uppercase tracking-widest">Manual Asset Entry</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="glass-card p-8 border-fuchsia-500/5 hover:bg-fuchsia-500/[0.02] transition-colors group">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center">
              <History className="w-4 h-4 mr-2 text-fuchsia-500" />
              Internal Protocol
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5" />
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">Verify that the asset belongs to your authorized company registry.</p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5" />
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">Audit the ledger scan count and status before shipping to distribution.</p>
              </li>
            </ul>
          </div>

          <div className="glass-card p-8 border-fuchsia-500/5 hover:bg-fuchsia-500/[0.02] transition-colors group">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center">
              <Layout className="w-4 h-4 mr-2 text-fuchsia-500" />
              Quality Assurance
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5" />
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">Point your camera at the digital identifier label for instant decoding.</p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5" />
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">Ensure steady macro-focus for high-precision cryptographic checks.</p>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );

  async function handleManualVerify() {
    if (inputValue.trim()) {
      let finalId = inputValue.trim();
      try {
        if (finalId.startsWith('http')) {
          const url = new URL(finalId);
          const parts = url.pathname.split('/');
          finalId = parts[parts.length - 1];
        }
      } catch(e) {}
      await verifyProductAsManufacturer(finalId);
    } else {
      toast.error('Identity key required');
    }
  }
}

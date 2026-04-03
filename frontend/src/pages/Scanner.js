import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, QrCode, Camera, AlertCircle, Upload, FileUp, ArrowLeft, Maximize2, Zap, LogOut, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function Scanner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualInput, setManualInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [uploadMode, setUploadMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);

      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            toast.success('QR code found! Verifying...');
            setUploading(false);
            setUploadMode(false);
            
            let finalId = code.data.trim();
            try {
              if (finalId.startsWith('http')) {
                const url = new URL(finalId);
                const parts = url.pathname.split('/');
                finalId = parts[parts.length - 1];
              }
            } catch(e) {}
            
            navigate(`/verify/${finalId}`);
          } else {
            toast.error('No QR code detected. Try a clearer image.');
            setUploading(false);
          }

          URL.revokeObjectURL(image.src);
        } catch (error) {
          toast.error('Failed to decode QR code.');
          setUploading(false);
        }
      };

      image.onerror = () => {
        toast.error('Failed to load image.');
        setUploading(false);
      };
    } catch (error) {
      toast.error('Processing failed.');
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  };

  useEffect(() => {
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
  }, [html5QrCode]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      
      // Step 1: Request permissions and get cameras
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
        (decodedText) => {
          try {
            let finalId = decodedText.trim();
            if (finalId.startsWith('http')) {
              const url = new URL(finalId);
              const parts = url.pathname.split('/');
              finalId = parts[parts.length - 1];
            }
            qrCode.stop().catch(() => {}).finally(() => {
              navigate(`/verify/${finalId}`);
            });
          } catch (e) {
            navigate(`/verify/${decodedText.trim()}`);
          }
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      <nav className="p-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-3 glass rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(217,70,239,0.2)] transition-all group"
          title="Go Back"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        {user && (
          <Button
            onClick={() => { logout(); navigate('/'); }}
            variant="ghost"
            className="text-zinc-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="w-20 h-20 bg-fuchsia-600/10 rounded-3xl flex items-center justify-center mx-auto border border-fuchsia-500/20 fuchsia-glow">
            <QrCode className="w-10 h-10 text-fuchsia-500" />
          </div>
          <h1 className="text-5xl font-black heading-gradient tracking-tighter">Initialize Protocol</h1>
          <p className="text-zinc-500 text-lg">Point camera at the encrypted asset label.</p>
        </motion.div>

        <div className="w-full max-w-md relative">
          <AnimatePresence mode="wait">
            {cameraError || manualInput || uploadMode ? (
              <motion.div
                key="fallback-modes"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {uploadMode ? (
                  <div className="glass-card p-10 text-center space-y-8">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center">
                      <Upload className="w-4 h-4 mr-2 text-fuchsia-500" />
                      Static Image Import
                    </h3>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-white/10 rounded-[32px] p-12 hover:border-fuchsia-500/30 hover:bg-white/[0.02] transition-all cursor-pointer group"
                      onClick={() => document.getElementById('qr-upload').click()}
                    >
                      <input type="file" id="qr-upload" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                      <FileUp className="w-16 h-16 text-zinc-700 mx-auto mb-6 group-hover:scale-110 transition-transform group-hover:text-fuchsia-500" />
                      <p className="text-sm font-bold text-zinc-500 group-hover:text-zinc-300">
                        {uploading ? 'De-encrypting...' : 'Drag & Drop Asset Capture'}
                      </p>
                    </div>
                    <button onClick={() => setUploadMode(false)} className="text-xs font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Return to Live Stream</button>
                  </div>
                ) : (
                  <div className="glass-card p-10 space-y-8">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                      <Maximize2 className="w-4 h-4 mr-2 text-fuchsia-500" />
                      Manual Entry
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="0x8f2... Enter Identity Hash"
                        className="glass-input w-full p-5 font-mono text-sm"
                      />
                      <Button
                        onClick={() => inputValue && navigate(`/verify/${inputValue}`)}
                        className="w-full btn-primary h-14 text-base rounded-2xl"
                      >
                        Authenticate Asset
                      </Button>
                    </div>
                    {cameraError && (
                      <div className="flex items-center space-x-3 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-[10px] font-bold text-red-400 uppercase leading-snug">Sensor Link Failure: {cameraError}</p>
                      </div>
                    )}
                    {(cameraError || manualInput) && (
                      <button onClick={() => { setManualInput(false); setCameraError(null) }} className="w-full text-xs font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Re-initialize Link</button>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="scanner-mode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                {/* Scanner Frame Decor */}
                <div className="absolute -inset-4 border border-fuchsia-500/10 rounded-[40px] pointer-events-none" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-fuchsia-500 rounded-tl-2xl z-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-fuchsia-500 rounded-tr-2xl z-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-fuchsia-500 rounded-bl-2xl z-20 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-fuchsia-500 rounded-br-2xl z-20 pointer-events-none" />

                {/* Scanning Animation Line */}
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

                <div className="mt-8 flex justify-center space-x-4">
                  <ModeButton icon={Upload} label="Import Image" onClick={() => setUploadMode(true)} />
                  <ModeButton icon={Maximize2} label="Manual Key" onClick={() => setManualInput(true)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <Tip icon={Zap} title="Instant Link" desc="Direct connection to the blockchain registry." />
          <Tip icon={Shield} title="Encrypted" desc="End-to-end cryptographic verification." />
          <Tip icon={Camera} title="High Res" desc="Auto-focus enabled for macro captures." />
        </div>
      </main>
    </div>
  );
}

function ModeButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-4 glass rounded-2xl hover:bg-white/10 transition-all group flex flex-col items-center space-y-2 border-white/5"
    >
      <Icon className="w-5 h-5 text-zinc-500 group-hover:text-fuchsia-500 transition-colors" />
      <span className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-300 uppercase tracking-widest">{label}</span>
    </button>
  );
}

function Tip({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <div className="w-10 h-10 rounded-full glass flex items-center justify-center mb-2">
        <Icon className="w-4 h-4 text-fuchsia-500" />
      </div>
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="text-[10px] text-zinc-500 uppercase tracking-tight">{desc}</p>
    </div>
  );
}

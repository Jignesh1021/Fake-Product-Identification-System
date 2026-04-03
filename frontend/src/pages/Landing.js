import { useNavigate } from 'react-router-dom';
import { Shield, QrCode, CheckCircle, AlertTriangle, ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1], rotate: [0, -90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" 
        />
        <div className="absolute inset-0 bg-zinc-950/40" />
      </div>

      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-fuchsia-600 rounded-xl flex items-center justify-center fuchsia-glow group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-plus">HashNity</span>
            </div>
            <div className="flex items-center space-x-6">
              <Button
                onClick={() => navigate('/scan')}
                variant="ghost"
                className="text-zinc-400 hover:text-white transition-colors"
                data-testid="nav-scan-button"
              >
                Scan Product
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="btn-primary"
                data-testid="nav-login-button"
              >
                Sign in / Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", staggerChildren: 0.2 }}
            className="flex flex-col items-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-[0_0_30px_rgba(217,70,239,0.1)]"
            >
              <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-fuchsia-500">Powered by Blockchain</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-6xl md:text-8xl font-black heading-gradient leading-[1.1] tracking-tighter mb-8 max-w-5xl mx-auto"
            >
              Real Products. <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 drop-shadow-[0_0_30px_rgba(217,70,239,0.3)]">Verified</span> Instantly.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            >
              HashNity provides an end-to-end cryptographic registry for brands to protect their integrity and empower customers with instant truth.
            </motion.p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                onClick={() => navigate('/scan')}
                className="w-full sm:w-auto px-10 py-8 text-lg btn-primary flex items-center gap-3"
                data-testid="hero-scan-button"
              >
                <QrCode className="w-6 h-6" />
                Scan as Guest
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                className="w-full sm:w-auto px-10 py-8 text-lg border-white/10 hover:bg-white/5 rounded-2xl flex items-center gap-3"
                data-testid="hero-login-button"
              >
                Brand Portal
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Trust Bar */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Blockchain Efficiency', value: '100%' },
              { label: 'Counterfeit Detection', value: 'Instant' },
              { label: 'Security Standard', value: 'SHA-256' },
              { label: 'System Uptime', value: '99.9%' }
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-black text-white font-mono mb-2">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">The Trust Layer for Commerce</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Three steps to complete product immortality and verification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              step="01"
              title="Secure Registration"
              description="Manufacturers commit unique product identifiers directly to the blockchain as cryptographic hashes."
              accent="blue"
            />
            <FeatureCard
              icon={QrCode}
              step="02"
              title="Encrypted Tags"
              description="System generates secure QR identities for physical attachment, creating a unique digital twin."
              accent="emerald"
            />
            <FeatureCard
              icon={CheckCircle}
              step="03"
              title="Consumer Trust"
              description="Verified with a single scan. Every verify event is tracked, immediately flagging duplicate or fake items."
              accent="indigo"
            />
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="py-32 bg-white/[0.01] border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
                Designed for the <br />
                <span className="text-cyan-500">Security-First</span> Brand.
              </h2>
              <div className="space-y-6">
                <CheckPoint title="Enterprise-Grade Hashing" detail="Leveraging industry-standard SHA-256 protocols for all data entry." />
                <CheckPoint title="Immutable Ledger" detail="Once registered on Ethereum/Polygon, product data cannot be modified." />
                <CheckPoint title="Anti-Cloning Technology" detail="Smart detection logic identifies if a single QR is being scanned in multiple locations." />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-8 glass rounded-[40px] border-white/10"
            >
              <img
                src="https://images.pexels.com/photos/15467758/pexels-photo-15467758.jpeg"
                alt="Architecture"
                className="rounded-[24px] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 hover:scale-[1.02]"
              />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-500/20 blur-[60px] rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-zinc-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-plus">HashNity</span>
          </div>
          <p className="text-zinc-600 text-sm font-medium uppercase tracking-widest">
            © 2026 HashNity System. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="p-2 glass rounded-full hover:bg-white/10 transition-colors">
              <Github className="w-5 h-5 text-zinc-400" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, step, title, description, accent }) {
  const accentMap = {
    blue: 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.05)] text-shadow',
    emerald: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.05)] text-shadow',
    indigo: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20 group-hover:border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.05)] text-shadow'
  };

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className={`glass-card p-10 flex flex-col h-full border-b-[4px] ${accentMap[accent]}`}
    >
      <div className="flex justify-between items-start mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${accentMap[accent]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <span className="text-sm font-black mono text-zinc-700">{step}</span>
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-zinc-500 leading-relaxed flex-1 italic">
        "{description}"
      </p>
    </motion.div>
  );
}

function CheckPoint({ title, detail }) {
  return (
    <div className="flex items-start space-x-4 group">
      <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center mt-1 group-hover:bg-cyan-500/20 transition-colors">
        <CheckCircle className="w-4 h-4 text-cyan-500" />
      </div>
      <div>
        <h4 className="font-bold text-white text-lg transition-colors group-hover:text-cyan-400">{title}</h4>
        <p className="text-zinc-500 text-sm mt-1">{detail}</p>
      </div>
    </div>
  );
}

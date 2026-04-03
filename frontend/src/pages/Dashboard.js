import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, LogOut, Package, TrendingUp, CheckCircle, AlertTriangle, Camera, User, List, Layers, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const { account, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, productsRes] = await Promise.all([
          axios.get(`${API}/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/products`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setStats(statsRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const menuItems = [
    { icon: TrendingUp, label: 'Dashboard', path: '/dashboard', active: true },
    { icon: Plus, label: 'Register Product', path: '/register-product' },
    { icon: Camera, label: 'Scan Products', path: '/manufacturer/scan' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Sidebar - Fix position */}
      <aside className="w-72 fixed h-full glass border-r border-white/5 z-50">
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-fuchsia-600 rounded-xl flex items-center justify-center fuchsia-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-plus">HashNity</span>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${item.active
                  ? 'bg-fuchsia-600/10 text-white border border-fuchsia-500/20'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${item.active ? 'text-fuchsia-500' : 'group-hover:text-fuchsia-400'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-white/5 mt-auto">
            <div className="flex items-center space-x-3 mb-6 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.full_name || 'Manufacturer'}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={account ? disconnectWallet : connectWallet}
              variant="outline"
              className={`w-full justify-start mb-3 rounded-xl transition-all border-white/5 bg-white/5 hover:bg-white/10 ${account ? 'text-fuchsia-400 border-fuchsia-400/20 bg-fuchsia-400/10' : 'text-zinc-400 hover:text-white'}`}
            >
              <Wallet className="w-5 h-5 mr-3" />
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-72 min-h-screen">
        <div className="max-w-7xl mx-auto p-12">
          <header className="flex justify-between items-end mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-5xl font-extrabold heading-gradient tracking-tight mb-3">
                Dashboard
              </h1>
              <p className="text-zinc-500 text-lg">Manage your digital assets and product lifecycle</p>
            </motion.div>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/register-product')}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Product
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 skeleton" />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            >
              <StatCard
                icon={Package}
                label="Total Products"
                value={stats?.total_products}
                color="amber"
              />
              <StatCard
                icon={TrendingUp}
                label="Global Scans"
                value={stats?.total_scans}
                color="sky"
              />
              <StatCard
                icon={CheckCircle}
                label="Verified True"
                value={stats?.verified_products}
                color="emerald"
              />
              <StatCard
                icon={Shield}
                label="Node Status"
                value="ONLINE"
                color="emerald"
                subValue="Mainnet Link"
              />
            </motion.div>
          )}

          {/* Product Feed */}
          <section className="glass-card overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse" />
                <h2 className="text-xl font-bold text-white">On-Chain Ledger</h2>
              </div>
              <div className="flex items-center space-x-2 text-xs text-zinc-500 font-mono">
                <Layers className="w-4 h-4" />
                <span>{products.length} BLOCKS</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="px-8 py-4">Product</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Batch ID</th>
                    <th className="px-8 py-4 text-right">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {products.map((product, idx) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, ease: "easeOut" }}
                        className="group hover:bg-white/[0.04] transition-all cursor-pointer relative"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        <td className="px-8 py-6 relative">
                          <div className="absolute inset-y-0 left-0 w-1 bg-fuchsia-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl border border-white/10 bg-black overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-fuchsia-500/20 transition-all duration-500">
                              {product.image_url ? (
                                <img
                                  src={`${BACKEND_URL}${product.image_url}`}
                                  className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out"
                                  alt=""
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-zinc-700 group-hover:text-fuchsia-500 transition-colors" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white transition-colors group-hover:text-fuchsia-400">
                                {product.name}
                              </p>
                              <p className="text-xs text-zinc-500 font-mono mt-1 group-hover:text-zinc-400 transition-colors">{product.id.substring(0, 18)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${product.verification_count > 0 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-widest text-[10px]">
                              {product.verification_count > 0 ? 'Active' : 'Idle'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-mono text-zinc-300 bg-black/50 px-3 py-1.5 rounded-md border border-white/5 group-hover:border-fuchsia-500/30 transition-colors">
                            {product.batch_number}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="inline-flex flex-col items-end group-hover:-translate-x-2 transition-transform duration-300">
                            <p className="text-lg font-bold text-white font-mono">{product.verification_count}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter group-hover:text-fuchsia-500/70 transition-colors">Scans</p>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {products.length === 0 && !loading && (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-zinc-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Registry is Empty</h3>
                <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Start by registering your first product to see analytics here.</p>
                <Button onClick={() => navigate('/register-product')} className="btn-primary">
                  Begin Registration
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, subValue }) {
  const colorMap = {
    amber: 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20 shadow-[0_0_30px_rgba(217,70,239,0.15)]',
    sky: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]',
    emerald: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.1)]',
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Icon className="w-16 h-16 -translate-y-4 translate-x-4" />
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-white">{value || 0}</div>
          {subValue && <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{subValue}</div>}
        </div>
      </div>
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest relative z-10">{label}</p>
    </div>
  );
}

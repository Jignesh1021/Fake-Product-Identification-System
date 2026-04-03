import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Building, ArrowRight, CheckCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getErrorMessage } from '@/utils/error';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(null); // manufacturer or customer
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Effect-based navigation: Redirect when user is authenticated
  useEffect(() => {
    if (user) {
      if (user.user_type === 'customer') {
        navigate('/scan');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Define Google Sign-In callback globally or via window
  useEffect(() => {
    window.handleGoogleSignIn = async (response) => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post(`${BACKEND_URL}/api/auth/google`, {
          token: response.credential,
          user_type: role || 'customer'
        });

        // Corrected: Single login call
        login(res.data.access_token, res.data.user);
        // navigate('/dashboard'); // Handled by effect
      } catch (err) {
        setError(getErrorMessage(err) || 'Google authentication failed');
      } finally {
        setLoading(false);
      }
    };

    return () => {
      delete window.handleGoogleSignIn;
    };
  }, [role, login, navigate]);

  useEffect(() => {
    if (window.google && !role) {
      // Initialize but don't render until role is selected
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: window.handleGoogleSignIn
      });
    }

    if (window.google && role) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: window.handleGoogleSignIn
      });
      renderGoogleButton();
    }
  }, [isLogin, role]);

  const renderGoogleButton = () => {
    const btnDiv = document.getElementById('googleButtonDiv');
    if (btnDiv && window.google) {
      window.google.accounts.id.renderButton(btnDiv, {
        theme: 'filled_black',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        shape: 'rectangular'
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Please select your role first');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';

      // Fix: Backend expects user_type, not role
      const payload = {
        ...formData,
        user_type: role
      };

      const response = await axios.post(`${BACKEND_URL}/api${endpoint}`, payload);

      login(response.data.access_token, response.data.user);
      // navigate('/dashboard'); // Handled by effect
    } catch (err) {
      setError(getErrorMessage(err) || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-600/5 blur-[120px] rounded-full" />

      <nav className="p-8">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-fuchsia-600 rounded-xl flex items-center justify-center fuchsia-glow">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-plus">HashNity</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl"
        >
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded">
                Secure Node 0xAF
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
                {isLogin ? 'Welcome Back' : 'Join Registry'}
              </h1>
              <p className="text-zinc-500">Access the decentralized product verification network.</p>
            </div>

            {/* Role Selection */}
            {!role ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest text-center mb-6">Select Access Type</p>
                <div className="grid grid-cols-1 gap-4">
                  <RoleCard
                    icon={Building}
                    title="Manufacturer"
                    desc="Register and manage brand inventory"
                    onClick={() => setRole('manufacturer')}
                  />
                  <RoleCard
                    icon={UserCheck}
                    title="Customer"
                    desc="Track purchases and verify history"
                    onClick={() => setRole('customer')}
                  />
                </div>
                {error && <p className="text-red-400 text-sm text-center mt-4 bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</p>}
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-600/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-fuchsia-500" />
                    </div>
                    <span className="text-sm font-bold text-white uppercase tracking-wider">{role}</span>
                  </div>
                  <button onClick={() => setRole(null)} className="text-xs text-zinc-500 hover:text-white transition-colors">Change Role</button>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/5">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        key="register-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-5"
                      >
                        <InputWrapper icon={Mail} label="Full Name">
                          <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="glass-input w-full"
                          />
                        </InputWrapper>
                        {role === 'manufacturer' && (
                          <InputWrapper icon={Building} label="Company">
                            <input
                              type="text"
                              name="company_name"
                              value={formData.company_name}
                              onChange={handleChange}
                              className="glass-input w-full"
                            />
                          </InputWrapper>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <InputWrapper icon={Mail} label="Email Address">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="glass-input w-full"
                      required
                    />
                  </InputWrapper>

                  <InputWrapper icon={Lock} label="Security Key">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="glass-input w-full"
                      required
                    />
                  </InputWrapper>

                  <Button
                    type="submit"
                    className="w-full btn-primary h-14 text-base"
                    disabled={loading}
                    data-testid="auth-submit-button"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center">
                        {isLogin ? 'Access' : 'Register Metadata'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="relative py-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5 shadow-[0_0_10px_rgba(255,255,255,0.02)]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b0b0d] px-4 text-zinc-500 font-bold tracking-[0.2em] border border-white/5 rounded-full py-1 text-[9px]">
                      Secure Portal Entry
                    </span>
                  </div>
                </div>

                <div className="flex justify-center w-full group">
                  <div className="w-full p-px bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent rounded-xl transition-all duration-500 group-hover:via-fuchsia-500/40">
                    <div id="googleButtonDiv" className="w-full flex justify-center overflow-hidden rounded-xl bg-black/40 backdrop-blur-sm" data-testid="google-auth-container"></div>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-xl border border-red-400/20 animate-fade-in" data-testid="auth-error">{error}</p>}
              </div>
            )}
          </div>

          <p className="text-center mt-8 text-zinc-600 text-sm">
            Protected by End-to-End Encryption <br />
            <span className="text-[10px] font-mono opacity-50">NODE_VER_5.0.2 // PROTOCOL_HTTPS_2.0</span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="glass rounded-2xl p-6 text-left hover:bg-white/[0.08] hover:border-fuchsia-500/30 transition-all group flex items-center space-x-6"
    >
      <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:border-fuchsia-500/20 group-hover:bg-fuchsia-600/10 transition-all">
        <Icon className="w-6 h-6 text-zinc-400 group-hover:text-fuchsia-500 transition-colors" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-zinc-500 group-hover:text-zinc-400">{desc}</p>
      </div>
    </button>
  );
}

function InputWrapper({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

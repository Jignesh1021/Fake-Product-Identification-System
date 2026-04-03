import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CustomerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { ...formData, user_type: 'customer' };
      const response = await axios.post(`${API}${endpoint}`, payload);

      localStorage.setItem('customer_token', response.data.access_token);
      localStorage.setItem('customer_user', JSON.stringify(response.data.user));
      toast.success(isLogin ? 'Login successful!' : 'Registration successful!');
      navigate('/customer/scan');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-[#f59e0b]" />
          </div>
          <h1 className="text-3xl font-bold heading text-white mb-2">HashNity</h1>
          <p className="text-zinc-400">Customer Account</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-sm" data-testid="customer-auth-form">
          <div className="flex mb-6 bg-zinc-950 rounded-sm p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium uppercase tracking-wider transition-colors ${isLogin ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              data-testid="customer-login-tab"
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium uppercase tracking-wider transition-colors ${!isLogin ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              data-testid="customer-register-tab"
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="full_name" className="text-zinc-300">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="mt-2 bg-zinc-900/50 border-zinc-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 rounded-sm h-12 px-4 text-white placeholder:text-zinc-600"
                  placeholder="Enter your full name"
                  required={!isLogin}
                  data-testid="customer-fullname-input"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 bg-zinc-900/50 border-zinc-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 rounded-sm h-12 px-4 text-white placeholder:text-zinc-600"
                placeholder="Enter your email"
                required
                data-testid="customer-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-2 bg-zinc-900/50 border-zinc-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 rounded-sm h-12 px-4 text-white placeholder:text-zinc-600"
                placeholder="Enter your password"
                required
                data-testid="customer-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 mt-6 rounded-sm disabled:opacity-50"
              data-testid="customer-submit-button"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">Want to continue as a guest?</p>
            <Button
              onClick={() => navigate('/scan')}
              variant="ghost"
              className="text-[#f59e0b] hover:text-[#f59e0b]/80 mt-2 text-sm"
              data-testid="guest-scan-button"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan without Login
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            data-testid="back-home-link"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

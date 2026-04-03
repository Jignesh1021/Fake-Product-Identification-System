import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import CustomerAuth from './pages/CustomerAuth';
import Dashboard from './pages/Dashboard';
import RegisterProduct from './pages/RegisterProduct';
import Scanner from './pages/Scanner';
import ManufacturerScan from './pages/ManufacturerScan';
import VerificationResult from './pages/VerificationResult';
import ProductDetails from './pages/ProductDetails';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';
import '@/App.css';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/scan" element={<Scanner />} />
      <Route path="/verify/:productId" element={<VerificationResult />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/manufacturer/scan"
        element={
          <PrivateRoute>
            <ManufacturerScan />
          </PrivateRoute>
        }
      />
      <Route
        path="/register-product"
        element={
          <PrivateRoute>
            <RegisterProduct />
          </PrivateRoute>
        }
      />
      <Route
        path="/product/:productId"
        element={
          <PrivateRoute>
            <ProductDetails />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;

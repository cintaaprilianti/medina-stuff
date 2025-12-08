import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Public Pages
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';

// Auth Pages
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import VerifyEmail from './auth/VerifyEmail';
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';

// Customer Pages
import CustomerDashboard from './customer/CustomerDashboard';
import CustomerProducts from './customer/CustomerProducts';
import CustomerCart from './customer/CustomerCart';
import CustomerOrders from './customer/CustomerOrders';
import CustomerWishlist from './customer/CustomerWishlist';
import CustomerProfile from './customer/CustomerProfile';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import AdminLayout from './admin/AdminLayout';
import CategoryManagement from './admin/CategoryManagement';
import ProductManagement from './admin/ProductManagement';
import ProductVariantManagement from './admin/ProductVariantManagement';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />

        {/* AUTH ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify/:userId/:token" element={<VerifyEmail />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* CUSTOMER ROUTES - Wrapped with CustomerDashboard Layout */}
        <Route path="/customer" element={<CustomerDashboard />}>
          <Route index element={<Navigate to="/customer/products" replace />} />
          <Route path="products" element={<CustomerProducts />} />
          <Route path="cart" element={<CustomerCart />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="wishlist" element={<CustomerWishlist />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>
        
        {/* Legacy route - redirect to /customer/products */}
        <Route path="/dashboard" element={<Navigate to="/customer/products" replace />} />

        {/* ADMIN ROUTES - Wrapped with AdminLayout */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="products/:productId/variants" element={<ProductVariantManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
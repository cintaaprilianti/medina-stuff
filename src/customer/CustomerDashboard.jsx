import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  ShoppingBag, Menu, X, User, Heart, Search, ShoppingCart, Package, LogOut
} from 'lucide-react';

/**
 * CustomerDashboard - Layout wrapper untuk semua halaman customer
 * Menyediakan navbar, sidebar, dan auth protection
 */
function CustomerDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState({
    id: '',
    nama: 'Guest User',
    email: 'guest@example.com',
    nomorTelepon: '08123456789',
    alamat: 'Belum diatur'
  });

  // Auth check
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          navigate('/login', { replace: true });
          return;
        }

        const user = JSON.parse(storedUser);
        const role = (user.role || '').toString().trim().toUpperCase();

        // Redirect admin to admin panel
        if (role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }

        const updatedUser = {
          id: user.id || '',
          nama: user.nama || 'User',
          email: user.email || 'user@example.com',
          nomorTelepon: user.nomorTelepon || user.phone || '08123456789',
          alamat: user.alamat || 'Belum diatur'
        };

        setUserData(updatedUser);

        // Redirect to products if on base /customer path
        if (location.pathname === '/customer' || location.pathname === '/customer/') {
          navigate('/customer/products', { replace: true });
        }
      } catch (err) {
        console.error('Error parsing user:', err);
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  // Load cart & wishlist counts
  useEffect(() => {
    const updateCounts = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 0), 0));
      setWishlistCount(wishlist.length);
    };

    updateCounts();

    // Listen for storage changes
    window.addEventListener('storage', updateCounts);
    return () => window.removeEventListener('storage', updateCounts);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActiveRoute = (path) => {
    if (path === '/customer' || path === '/customer/products') {
      return location.pathname === '/customer' || location.pathname === '/customer/products';
    }
    return location.pathname === path;
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Memuat Toko...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/customer/products', icon: ShoppingBag, label: 'Belanja Sekarang' },
    { path: '/customer/cart', icon: ShoppingCart, label: 'Keranjang', badge: cartCount },
    { path: '/customer/orders', icon: Package, label: 'Pesanan Saya' },
    { path: '/customer/wishlist', icon: Heart, label: 'Wishlist', badge: wishlistCount },
    { path: '/customer/profile', icon: User, label: 'Profil Saya' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-pink-50 rounded-lg transition"
              >
                {isSidebarOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
              </button>

              <a href="/customer/products" className="flex items-center space-x-3 group">
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Medina Stuff"
                    className="w-8 h-8 object-contain z-10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white z-10 hidden">
                    MS
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-base font-bold text-gray-800">Medina Stuff</div>
                  <div className="text-xs text-gray-500">Fashion Muslimah Premium</div>
                </div>
              </a>
            </div>

            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-2xl mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <button
                onClick={() => navigate('/customer/cart')}
                className="relative p-2 hover:bg-pink-50 rounded-full transition"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#cb5094] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Profile */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">{getInitials(userData.nama)}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">{userData.nama}</div>
                  <div className="text-xs text-[#cb5094] font-medium">Customer</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#cb5094] text-sm"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16 min-h-screen">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl transform transition-transform duration-300 pt-16 lg:pt-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="h-full flex flex-col">
            <nav className="flex-1 p-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg'
                        : 'text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        isActive ? 'bg-white text-[#cb5094]' : 'bg-[#cb5094] text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Main Content - Render child routes */}
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ searchQuery, userData, setCartCount, setWishlistCount }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerDashboard;
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  PackageSearch, FolderTree, ClipboardList, CreditCard, LogOut
} from 'lucide-react';

function AdminLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState({
    nama: 'Admin',
    email: 'admin@medinastuff.com',
    role: 'ADMIN'
  });

  const navigate = useNavigate();
  const location = useLocation();

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
        const userRole = (user.role || '').toString().trim().toUpperCase();

        if (userRole !== 'ADMIN') {
          if (userRole === 'CUSTOMER') {
            navigate('/customer/products', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
          return;
        }

        setAdminData({
          nama: user.nama || 'Admin',
          email: user.email || 'admin@medinastuff.com',
          role: userRole
        });

      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/admin/products', icon: PackageSearch, label: 'Produk' },
    { path: '/admin/categories', icon: FolderTree, label: 'Kategori' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Pesanan' },
    { path: '/admin/transactions', icon: CreditCard, label: 'Transaksi' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <a href="/admin/products" className="flex items-center space-x-3 group">
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="MyMedina"
                    className="w-8 h-8 object-contain z-10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white z-10 hidden">
                    MM
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-base font-bold text-gray-800">MyMedina</div>
                  <div className="text-xs text-gray-500">by Medina Stuff</div>
                </div>
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">{getInitials(adminData.nama)}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">{adminData.nama}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Layout Utama */}
      <div className="pt-16 min-h-screen pb-20 lg:pb-0 flex">
        {/* Sidebar Desktop - PERSIS seperti di AdminDashboard yang kamu bilang pas */}
        <aside className="hidden lg:block w-64 bg-white shadow-2xl fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="h-full flex flex-col">
            <nav className="flex-1 p-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg'
                        : 'text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout - PERSIS seperti di AdminDashboard */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 lg:ml-64">
          <div className="max-w-7xl mx-auto py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Bottom Navigation Mobile - 5 kolom dengan Keluar di paling kanan */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl lg:hidden z-50">
        <div className="grid grid-cols-5 h-16">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 relative transition-all duration-200 ${
                  isActive ? 'text-[#cb5094]' : 'text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-b-full"></div>
                )}
              </button>
            );
          })}

          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center space-y-1 text-red-600"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default AdminLayout;
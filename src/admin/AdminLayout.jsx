import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Menu, X, PackageSearch, FolderTree, ClipboardList, CreditCard, Settings, LogOut
} from 'lucide-react';

function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState({
    nama: 'Admin',
    email: 'admin@medinastuff.com',
    role: 'admin'
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          console.log('No token/user found → redirect to login');
          navigate('/login', { replace: true });
          return;
        }

        const user = JSON.parse(storedUser);
        const userRole = (user.role || '').toString().trim().toUpperCase();

        setAdminData({
          nama: user.nama || 'Admin',
          email: user.email || 'admin@medinastuff.com',
          role: userRole
        });

        if (userRole !== 'ADMIN') {
          console.log('Access denied. Role:', userRole);
          if (userRole === 'CUSTOMER') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
          return;
        }

        console.log('Admin access granted:', user.nama);
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
    { path: '/admin/products', icon: PackageSearch, label: 'Products' },
    { path: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/admin/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

              <a 
                href="/admin/dashboard" 
                className="flex items-center space-x-3 group"
              >
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
                  <div className="text-base font-bold text-gray-800">Admin Panel</div>
                  <div className="text-xs text-gray-500">Medina Stuff</div>
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
                  <div className="text-xs text-[#cb5094] font-medium">Administrator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16 min-h-screen">
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
                    <span>{item.label}</span>
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
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
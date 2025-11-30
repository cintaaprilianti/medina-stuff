// src/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import {
  Menu, X, PackageSearch, FolderTree, ClipboardList, CreditCard, Settings, LogOut, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productAPI, categoryAPI } from '../utils/api';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState({ nama: 'Admin', email: '', role: 'ADMIN' });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    todayOrders: 0,
    pendingOrders: 0,
    monthlyRevenue: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) throw new Error('Unauthorized');

        const user = JSON.parse(userStr);
        const role = (user.role || '').toString().trim().toUpperCase();
        if (role !== 'ADMIN') throw new Error('Forbidden');

        setAdminData({
          nama: user.nama || 'Admin',
          email: user.email || '',
          role: 'ADMIN'
        });

        // FETCH DATA DENGAN FIX UNTUK STRUKTUR BACKEND KAMU
        const [prodRes, catRes] = await Promise.all([
          productAPI.getAll({ limit: 5 }),
          categoryAPI.getAll(true)
        ]);

        // FIX INI YANG PENTING! Pastikan selalu array
        const productsArray = prodRes.data?.data || prodRes.data || [];
        const categoriesArray = Array.isArray(catRes) ? catRes : catRes.data || [];

        setRecentProducts(productsArray);
        setStats({
          totalProducts: productsArray.length,
          totalCategories: categoriesArray.length,
          todayOrders: 0,
          pendingOrders: 8,
          monthlyRevenue: 0
        });

      } catch (err) {
        console.error(err);
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isActiveRoute = (path) => {
    return window.location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl font-bold">Loading Admin Panel...</p>
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
      {/* Navbar - SAMA PERSIS DENGAN ADMINLAYOUT */}
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

            {/* Profile */}
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
        {/* Sidebar - SAMA PERSIS DENGAN ADMINLAYOUT */}
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

        {/* Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Selamat Datang, {adminData.nama.split(' ')[0]}!</h1>
            <p className="text-gray-600 mb-10">Ini ringkasan toko kamu hari ini</p>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Total Produk', value: stats.totalProducts, icon: PackageSearch },
                { label: 'Kategori', value: stats.totalCategories, icon: FolderTree },
                { label: 'Order Hari Ini', value: stats.todayOrders, icon: ClipboardList },
                { label: 'Revenue Bulan Ini', value: `Rp ${(stats.monthlyRevenue / 1000000).toFixed(1)}`, icon: CreditCard },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl flex items-center justify-center mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Products */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Produk Terbaru</h2>
                <button
                  onClick={() => navigate('/admin/products')}
                  className="text-[#cb5094] hover:underline font-medium flex items-center gap-2"
                >
                  Lihat Semua <Plus className="w-5 h-5" />
                </button>
              </div>

              {recentProducts.length === 0 ? (
                <div className="text-center py-12">
                  <PackageSearch className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada produk</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {recentProducts.map(p => (
                    <div key={p.id} className="border rounded-2xl overflow-hidden hover:shadow-lg transition">
                      <img src={p.gambarUrl} alt={p.nama} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <h3 className="font-bold text-gray-800 truncate">{p.nama}</h3>
                        <p className="text-[#cb5094] font-bold">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(p.hargaDasar)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
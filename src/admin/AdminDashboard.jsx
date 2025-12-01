<<<<<<< HEAD
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
=======
import { useState, useEffect } from 'react';
import {
  Menu, X, PackageSearch, Settings, LogOut,
  FolderTree, ClipboardList, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Products from './Product';
import Category from './Category'; // PASTI SUDAH ADA

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // default products
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [adminData, setAdminData] = useState({
    nama: 'Admin',
    email: 'admin@medinastuff.com',
    role: 'admin'
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
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
          navigate(userRole === 'CUSTOMER' ? '/dashboard' : '/login', { replace: true });
        }
      } catch (err) {
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

<<<<<<< HEAD
  const isActiveRoute = (path) => {
    return window.location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl font-bold">Loading Admin Panel...</p>
=======
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Admin Panel...</p>
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
        </div>
      </div>
    );
  }

<<<<<<< HEAD
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
=======
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50">
      {/* Navbar */}
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
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

<<<<<<< HEAD
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
=======
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  <img src="/logo.png" alt="Medina Stuff" className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }} />
                  <span className="absolute inset-0 hidden items-center justify-center text-2xl font-bold text-white">MS</span>
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
                </div>
                <div className="hidden sm:block">
                  <div className="text-base font-bold text-gray-800">Admin Panel</div>
                  <div className="text-xs text-gray-500">Medina Stuff</div>
                </div>
<<<<<<< HEAD
              </a>
            </div>

            {/* Profile */}
=======
              </div>
            </div>

>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
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
<<<<<<< HEAD
        {/* Sidebar - SAMA PERSIS DENGAN ADMINLAYOUT */}
=======
        {/* Sidebar */}
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl transform transition-transform duration-300 pt-16 lg:pt-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="h-full flex flex-col">
            <nav className="flex-1 p-6 space-y-2">
<<<<<<< HEAD
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
=======
              {[
                { tab: 'products',     icon: PackageSearch, label: 'Products' },
                { tab: 'categories',   icon: FolderTree,    label: 'Categories' },   // DIPERBAIKI: categories
                { tab: 'orders',       icon: ClipboardList, label: 'Orders' },
                { tab: 'transactions', icon: CreditCard,    label: 'Transactions' },
                { tab: 'settings',     icon: Settings,      label: 'Settings' },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => { 
                    setActiveTab(item.tab); 
                    setIsSidebarOpen(false); 
                  }}
                  className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all font-medium ${
                    activeTab === item.tab
                      ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg'
                      : 'text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-gray-200">
              <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all font-medium">
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

<<<<<<< HEAD
        {/* Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
=======
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
<<<<<<< HEAD
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
=======

            {/* KONTEN UTAMA — DIPERBAIKI DI SINI */}
            {activeTab === 'products' && <Products />}
            {activeTab === 'categories' && <Category />}   {/* DIPERBAIKI: categories */}
            {activeTab === 'orders' && (
              <div className="text-center py-32">
                <ClipboardList className="w-28 h-28 text-[#cb5094]/30 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-700 mb-4">Belum Ada Pesanan</h2>
                <p className="text-gray-500">Pesanan dari customer akan muncul di sini</p>
              </div>
            )}
            {activeTab === 'transactions' && (
              <div className="text-center py-32">
                <CreditCard className="w-28 h-28 text-[#cb5094]/30 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-700 mb-4">Belum Ada Transaksi</h2>
                <p className="text-gray-500">Riwayat transaksi akan muncul di sini</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="text-center py-32">
                <Settings className="w-28 h-28 text-[#cb5094]/30 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-700 mb-4">Pengaturan Sistem</h2>
                <p className="text-gray-500">Atur preferensi dan konfigurasi toko</p>
              </div>
            )}

            {/* Stats Card — tetap ada di semua tab */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {[
                { label: 'Total Produk', value: '156', color: 'from-purple-500 to-pink-500' },
                { label: 'Order Hari Ini', value: '12', color: 'from-blue-500 to-cyan-500' },
                { label: 'Pending', value: '8', color: 'from-yellow-500 to-orange-500' },
                { label: 'Revenue Bulan Ini', value: 'Rp 45.2M', color: 'from-green-500 to-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg p-6 text-center hover:shadow-xl transition-all border border-white/50">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}>
                    <div className="w-10 h-10 bg-white/40 rounded-xl"></div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
>>>>>>> eeb14088a2c38c749653677c08eef2127934afe3
          </div>
        </main>
      </div>
    </div>
  );
}
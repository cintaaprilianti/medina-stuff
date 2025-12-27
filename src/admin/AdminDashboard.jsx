import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PackageSearch, FolderTree, ClipboardList, CreditCard, LogOut, Home, Clock, CheckCircle, Menu, X, Truck
} from 'lucide-react';
import { productAPI, categoryAPI } from '../utils/api';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState({ nama: 'Admin', email: '', role: 'ADMIN' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const location = useLocation();

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

        // Ambil semua order
        const ordersRes = await api.get('/orders/admin/all', { params: { limit: 1000 } });
        const ordersArray = ordersRes.data.data || ordersRes.data.orders || [];

        // Ambil semua payment untuk hitung revenue akurat
        const paymentsRes = await Promise.all(
          ordersArray.map(async (order) => {
            try {
              const payRes = await api.get(`/payments/order/${order.id}`);
              return payRes.data.payments || [];
            } catch {
              return [];
            }
          })
        );

        const allPayments = paymentsRes.flat();
        const successfulPayments = allPayments.filter(p => 
          ['SETTLEMENT', 'SETTLED', 'CAPTURE'].includes(p.status?.toUpperCase())
        );

        // Hitung revenue dari payment yang berhasil
        const monthlyRevenue = successfulPayments.reduce((sum, p) => sum + Number(p.jumlah || 0), 0);

        // Hitung stats lain dari orders
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayOrdersCount = ordersArray.filter(order => {
          const orderDate = new Date(order.dibuatPada || order.createdAt);
          return orderDate >= today;
        }).length;

        const pendingOrdersCount = ordersArray.filter(order => 
          order.status === 'PENDING_PAYMENT' || order.status === 'PAID' || order.status === 'PROCESSING'
        ).length;

        // Produk & kategori tetap
        const [prodRes, catRes] = await Promise.all([
          productAPI.getAll({ limit: 10 }), // Hapus sort parameter
          categoryAPI.getAll(true)
        ]);

        const productsArray = prodRes.data?.data || prodRes.data || [];
        const categoriesArray = Array.isArray(catRes) ? catRes : catRes.data || [];

        setRecentProducts(productsArray);
        setStats({
          totalProducts: productsArray.length,
          totalCategories: categoriesArray.length,
          todayOrders: todayOrdersCount,
          pendingOrders: pendingOrdersCount,
          monthlyRevenue: monthlyRevenue // ← Sekarang akurat!
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

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  const getProductImages = (product) => {
    return product.gambarUrl?.split('|||').filter(url => url) || [];
  };

  const isPreOrder = (product) => {
    return product.preOrder === true || product.isPreOrder === true;
  };

  const isReadyStock = (product) => {
    return !isPreOrder(product) && product.aktif === true;
  };

  if (loading) {
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
    { path: '/admin/dashboard', icon: Home, label: 'Beranda' },
    { path: '/admin/products', icon: PackageSearch, label: 'Produk' },
    { path: '/admin/categories', icon: FolderTree, label: 'Kategori' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Pesanan' },
    { path: '/admin/transactions', icon: CreditCard, label: 'Transaksi' },
    { path: '/admin/shipments', icon: Truck, label: 'Pengiriman' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-pink-50 rounded-lg transition"
              >
                {isSidebarOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
              </button>

              <a href="/admin/dashboard" className="flex items-center space-x-3 group">
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
                  <div className="text-base font-bold text-gray-800">MyMedina</div>
                  <div className="text-xs text-gray-500">by Medina Stuff</div>
                </div>
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">
                    {adminData.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
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
        {/* Sidebar Desktop */}
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

        {/* Sidebar Mobile */}
        <aside className={`lg:hidden fixed top-16 left-0 z-40 w-64 bg-white shadow-2xl transform transition-transform duration-300 h-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6">
            <button
              onClick={() => {
                handleLogout();
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Selamat Datang, {adminData.nama.split(' ')[0]}!</h1>
            <p className="text-gray-600 mb-8 lg:mb-10">Ini ringkasan toko kamu hari ini</p>

            {/* Stats Cards - 5 cards, rapi & konsisten */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8 lg:mb-12">
              {/* Total Produk */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-4 lg:p-6 hover:shadow-2xl transition-all">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4">
                  <PackageSearch className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">Total Produk</p>
              </div>

              {/* Kategori */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-4 lg:p-6 hover:shadow-2xl transition-all">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4">
                  <FolderTree className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.totalCategories}</p>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">Kategori</p>
              </div>

              {/* Order Hari Ini */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-4 lg:p-6 hover:shadow-2xl transition-all">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4">
                  <ClipboardList className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.todayOrders}</p>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">Order Hari Ini</p>
              </div>

              {/* Menunggu Proses */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-4 lg:p-6 hover:shadow-2xl transition-all">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4">
                  <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.pendingOrders}</p>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">Menunggu Proses</p>
              </div>

              {/* Revenue Bulan Ini */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-4 lg:p-6 hover:shadow-2xl transition-all">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4">
                  <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{formatPrice(stats.monthlyRevenue)}</p>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">Revenue Bulan Ini</p>
              </div>
            </div>

            {/* Produk Terbaru */}
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="flex justify-between items-center mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Produk Terbaru</h2>
                <button
                  onClick={() => navigate('/admin/products')}
                  className="text-[#cb5094] hover:underline font-medium flex items-center gap-2 text-sm lg:text-base"
                >
                  Lihat Semua
                </button>
              </div>

              {recentProducts.length === 0 ? (
                <div className="text-center py-12">
                  <PackageSearch className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada produk</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {recentProducts.map(product => {
                    const images = getProductImages(product);
                    const mainImage = images[0] || 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image';
                    const productIsPreOrder = isPreOrder(product);
                    const productIsReadyStock = isReadyStock(product);

                    return (
                      <div
                        key={product.id}
                        className="group bg-white rounded-2xl shadow-md border-2 border-[#cb5094]/10 overflow-hidden hover:shadow-2xl hover:border-[#cb5094]/40 hover:scale-[1.02] transition-all duration-300 relative"
                      >
                        <div className="relative overflow-hidden aspect-[3/4]">
                          <img
                            src={mainImage}
                            alt={product.nama}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => e.target.src = 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image'}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          {product.category && (
                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#cb5094] px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-[#cb5094]/20">
                              {product.category.nama}
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[40px] leading-snug">
                            {product.nama}
                          </h3>

                          {(productIsPreOrder || productIsReadyStock) && (
                            <div className="mb-2">
                              {productIsPreOrder ? (
                                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#d4b896] to-[#e5c9a6] text-white px-3 py-1 rounded-full text-xs font-bold">
                                  <Clock className="w-3 h-3" />
                                  Pre Order
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                  <CheckCircle className="w-3 h-3" />
                                  Ready Stock
                                </div>
                              )}
                            </div>
                          )}

                          <div className="text-lg font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                            {formatPrice(product.hargaDasar)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl lg:hidden z-50">
        <div className="grid grid-cols-6 h-16">
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
                <span className="text-[9px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-b-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
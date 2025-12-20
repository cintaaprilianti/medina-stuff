import { useState, useEffect } from 'react';
import {
  PackageSearch, FolderTree, ClipboardList, CreditCard, LogOut, Plus, Eye, Clock, CheckCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { productAPI, categoryAPI } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

export default function AdminDashboard() {
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
  const [selectedProduct, setSelectedProduct] = useState(null);
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

        const [prodRes, catRes] = await Promise.all([
          productAPI.getAll({ limit: 10, sort: 'createdAt:desc' }),
          categoryAPI.getAll(true)
        ]);

        const productsArray = prodRes.data?.data || prodRes.data || [];
        const categoriesArray = Array.isArray(catRes) ? catRes : catRes.data || [];

        setRecentProducts(productsArray);
        setStats({
          totalProducts: productsArray.length,
          totalCategories: categoriesArray.length,
          todayOrders: 0,
          pendingOrders: 0,
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
        {/* Sidebar Desktop - PERSIS SAMA DENGAN CUSTOMER DASHBOARD */}
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

            {/* Logout - PERSIS seperti customer */}
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
          <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Selamat Datang, {adminData.nama.split(' ')[0]}!</h1>
            <p className="text-gray-600 mb-10">Ini ringkasan toko kamu hari ini</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Produk', value: stats.totalProducts, icon: PackageSearch },
                { label: 'Kategori', value: stats.totalCategories, icon: FolderTree },
                { label: 'Order Hari Ini', value: stats.todayOrders, icon: ClipboardList },
                { label: 'Revenue Bulan Ini', value: `Rp ${(stats.monthlyRevenue / 1000000).toFixed(1)}M`, icon: CreditCard },
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

            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-8">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {recentProducts.map(product => {
                    const images = getProductImages(product);
                    const mainImage = images[0] || 'https://via.placeholder.com/400?text=No+Image';
                    const productIsPreOrder = isPreOrder(product);
                    const productIsReadyStock = isReadyStock(product);

                    return (
                      <div
                        key={product.id}
                        className="group bg-white rounded-2xl shadow-md border-2 border-[#cb5094]/10 overflow-hidden hover:shadow-2xl hover:border-[#cb5094]/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer relative"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="relative overflow-hidden aspect-[3/4]">
                          <img
                            src={mainImage}
                            alt={product.nama}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=No+Image'}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          {product.category && (
                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#cb5094] px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-[#cb5094]/20">
                              {product.category.nama}
                            </div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                            <div className="bg-white rounded-full p-3 shadow-lg">
                              <Eye className="w-6 h-6 text-[#cb5094]" />
                            </div>
                          </div>
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

      {/* Modal Detail Produk */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Detail Produk</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <img 
                    src={selectedProduct.gambarUrl?.split('|||')[0] || 'https://via.placeholder.com/600'}
                    alt={selectedProduct.nama}
                    className="w-full h-96 object-cover rounded-2xl shadow-lg"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedProduct.nama}</h3>
                    {selectedProduct.category && (
                      <span className="inline-block bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-bold mb-3">
                        {selectedProduct.category.nama}
                      </span>
                    )}
                  </div>

                  <div className="border-t border-b border-gray-200 py-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Harga Dasar:</span>
                      <span className="text-2xl font-bold text-[#cb5094]">
                        {formatPrice(selectedProduct.hargaDasar)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stok:</span>
                      <span className="text-lg font-semibold text-gray-900">{selectedProduct.stok || 0}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Deskripsi:</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedProduct.deskripsi || 'Tidak ada deskripsi'}
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => navigate(`/admin/products/edit/${selectedProduct.id}`)}
                      className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      Edit Produk
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
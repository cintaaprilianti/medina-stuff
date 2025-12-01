import { useState, useEffect } from 'react';
import {
  ShoppingBag, Menu, X, User, Heart, Search, ShoppingCart, Package,
  LogOut, Star, Plus, Minus, Trash2, Edit2, Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../utils/api';

function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    id: '',
    nama: 'Guest User',
    email: 'guest@example.com',
    nomorTelepon: '08123456789',
    alamat: 'Belum diatur'
  });

  const [profileForm, setProfileForm] = useState(userData);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAll({
          active: true,
          limit: 100,
          sort: 'createdAt:desc'
        });

        const productList = response.data?.data || response.data || [];
        setProducts(productList.filter(p => p.aktif !== false));
      } catch (err) {
        console.error('Gagal memuat produk:', err);
        alert('Gagal memuat produk dari server');
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

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

        if (role === 'ADMIN') {
          navigate('/admin', { replace: true });
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
        setProfileForm(updatedUser);

      } catch (err) {
        console.error('Error parsing user:', err);
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const addToCart = (product) => {
    const size = prompt(`Pilih ukuran untuk ${product.nama}:`, 'M') || 'M';
    if (!size) return;

    const key = `${product.id}-${size}`;
    setCartItems(prev => {
      const existing = prev.find(item => item.key === key);
      if (existing) {
        return prev.map(item =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, size, key }];
    });
  };

  const updateQuantity = (key, change) => {
    setCartItems(prev =>
      prev.map(item =>
        item.key === key
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeFromCart = (key) => {
    setCartItems(prev => prev.filter(item => item.key !== key));
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getTotalPrice = () => cartItems.reduce((sum, item) => sum + item.hargaDasar * item.quantity, 0);

  const handleSaveProfile = () => {
    setUserData(profileForm);
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, ...profileForm };
    localStorage.setItem('user', JSON.stringify(updated));
    setIsEditingProfile(false);
    alert('Profil berhasil diperbarui!');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl font-bold">Memuat Toko...</p>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => 
    p.nama?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWishlist = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-pink-50 rounded-lg transition"
              >
                {isSidebarOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  MS
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900">Medina Stuff</h1>
                  <p className="text-xs text-gray-500">Fashion Muslimah Premium</p>
                </div>
              </div>
            </div>

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

            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('cart')}
                className="relative p-2 hover:bg-pink-50 rounded-full transition"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#cb5094] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {getInitials(userData.nama)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{userData.nama}</p>
                  <p className="text-xs text-[#cb5094]">Customer</p>
                </div>
              </div>
            </div>
          </div>

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

      <div className="flex pt-16 md:pt-16">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl transform transition-transform duration-300 lg:translate-x-0 pt-16 md:pt-16 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="p-4 space-y-1 overflow-y-auto h-full pb-20">
            {[
              { tab: 'products', icon: ShoppingBag, label: 'Belanja Sekarang' },
              { tab: 'cart', icon: ShoppingCart, label: 'Keranjang', badge: cartItems.reduce((s,i)=>s+i.quantity,0) },
              { tab: 'orders', icon: Package, label: 'Pesanan Saya' },
              { tab: 'wishlist', icon: Heart, label: 'Wishlist', badge: wishlist.length },
              { tab: 'profile', icon: User, label: 'Profil Saya' },
            ].map(item => (
              <button
                key={item.tab}
                onClick={() => {
                  setActiveTab(item.tab);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                  activeTab === item.tab
                    ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.tab ? 'bg-white text-[#cb5094]' : 'bg-[#cb5094] text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-all text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </nav>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 lg:ml-64 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">

            {activeTab === 'products' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Koleksi Terbaru</h1>
                  <p className="text-sm text-gray-600 mt-1">Temukan fashion muslimah terbaik untukmu</p>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {searchQuery ? 'Produk tidak ditemukan' : 'Belum Ada Produk'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {searchQuery ? 'Coba kata kunci lain' : 'Admin sedang menambahkan koleksi baru'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="relative overflow-hidden">
                          <img
                            src={product.gambarUrl || 'https://via.placeholder.com/400'}
                            alt={product.nama}
                            className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
                          >
                            <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-[#cb5094] text-[#cb5094]' : 'text-gray-600'}`} />
                          </button>
                          {product.category && (
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full">
                              <span className="text-xs font-bold text-[#cb5094]">{product.category.nama}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{product.nama}</h3>
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600">(4.9)</span>
                          </div>
                          <p className="text-lg font-bold text-[#cb5094] mb-3">{formatPrice(product.hargaDasar)}</p>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-2 rounded-xl font-bold text-xs hover:shadow-lg transform hover:scale-105 transition-all"
                          >
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cart' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
                  <p className="text-sm text-gray-600 mt-1">Kelola produk yang ingin kamu beli</p>
                </div>

                {cartItems.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                    <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang Kosong</h2>
                    <p className="text-sm text-gray-600 mb-6">Yuk pilih produk favoritmu!</p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition"
                    >
                      Mulai Belanja
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cartItems.map(item => (
                      <div key={item.key} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all">
                        <div className="flex gap-4">
                          <img 
                            src={item.gambarUrl || 'https://via.placeholder.com/200'} 
                            alt={item.nama} 
                            className="w-24 h-24 object-cover rounded-xl"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1">{item.nama}</h3>
                            <p className="text-xs text-gray-600 mb-2">Ukuran: <strong>{item.size}</strong></p>
                            <p className="text-lg font-bold text-[#cb5094]">{formatPrice(item.hargaDasar * item.quantity)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateQuantity(item.key, -1)} 
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-bold w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.key, 1)} 
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.key)} 
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Total Card - Full Width */}
                    <div className="lg:col-span-2 xl:col-span-3 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl shadow-xl p-6">
                      <div className="flex justify-between items-center text-white mb-4">
                        <h2 className="text-xl font-bold">Total Belanja</h2>
                        <p className="text-3xl font-bold">{formatPrice(getTotalPrice())}</p>
                      </div>
                      <button className="w-full bg-white text-[#cb5094] py-3 rounded-xl text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition-all">
                        Lanjut ke Checkout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wishlist Saya</h1>
                  <p className="text-sm text-gray-600 mt-1">Produk favorit yang kamu simpan</p>
                </div>

                {filteredWishlist.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                    <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Wishlist Kosong</h2>
                    <p className="text-sm text-gray-600 mb-6">Tambahkan produk favoritmu ke wishlist</p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition"
                    >
                      Jelajahi Produk
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {filteredWishlist.map(product => (
                      <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="relative overflow-hidden">
                          <img
                            src={product.gambarUrl || 'https://via.placeholder.com/400'}
                            alt={product.nama}
                            className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
                          >
                            <Heart className="w-4 h-4 fill-[#cb5094] text-[#cb5094]" />
                          </button>
                          {product.category && (
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full">
                              <span className="text-xs font-bold text-[#cb5094]">{product.category.nama}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{product.nama}</h3>
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600">(4.9)</span>
                          </div>
                          <p className="text-lg font-bold text-[#cb5094] mb-3">{formatPrice(product.hargaDasar)}</p>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-2 rounded-xl font-bold text-xs hover:shadow-lg transform hover:scale-105 transition-all"
                          >
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil Saya</h1>
                  <p className="text-sm text-gray-600 mt-1">Kelola informasi akun kamu</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                      {getInitials(userData.nama)}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-xl font-bold text-gray-800">{userData.nama}</h2>
                      <p className="text-sm text-gray-600">{userData.email}</p>
                    </div>
                    <button
                      onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                      className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-xl transition"
                    >
                      {isEditingProfile ? <><Save className="w-4 h-4" /> Simpan</> : <><Edit2 className="w-4 h-4" /> Edit</>}
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Nama Lengkap', field: 'nama' },
                      { label: 'Email', field: 'email', type: 'email' },
                      { label: 'No. Telepon', field: 'nomorTelepon' },
                      { label: 'Alamat Lengkap', field: 'alamat', textarea: true }
                    ].map(({ label, field, type, textarea }) => (
                      <div key={field} className={textarea ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
                        {isEditingProfile ? (
                          textarea ? (
                            <textarea
                              value={profileForm[field]}
                              onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })}
                              rows="3"
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:outline-none text-sm"
                            />
                          ) : (
                            <input
                              type={type || 'text'}
                              value={profileForm[field]}
                              onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:border-[#cb5094] focus:outline-none text-sm sm:text-lg"
                            />
                          )
                        ) : (
                          <p className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-xl sm:rounded-2xl text-sm sm:text-lg text-gray-700">{userData[field]}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-4 sm:gap-6 mt-6 sm:mt-10">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl hover:shadow-2xl transition"
                      >
                        Simpan Perubahan
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileForm(userData);
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl hover:bg-gray-300 transition"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(activeTab === 'orders' || activeTab === 'wishlist') && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-12 sm:p-24 text-center">
                <Package className="w-20 sm:w-32 h-20 sm:h-32 text-gray-300 mx-auto mb-4 sm:mb-8" />
                <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-6">Fitur Segera Hadir</h2>
                <p className="text-base sm:text-xl text-gray-600">Kami sedang menyiapkan fitur ini untukmu</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerDashboard;
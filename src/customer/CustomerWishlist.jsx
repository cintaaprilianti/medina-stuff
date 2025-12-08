import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { productAPI } from '../utils/api';

function CustomerWishlist() {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    loadWishlist();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ active: true, limit: 100 });
      const productList = response.data?.data || response.data || [];
      setProducts(productList.filter(p => p.aktif !== false));
    } catch (err) {
      console.error('Gagal memuat produk:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWishlist = () => {
    const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(saved);
  };

  const toggleWishlist = (id) => {
    const updated = wishlist.filter(x => x !== id);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const addToCart = (product) => {
    const size = prompt(`Pilih ukuran untuk ${product.nama}:`, 'M') || 'M';
    if (!size) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const key = `${product.id}-${size}`;
    const existing = cart.find(item => item.key === key);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1, size, key });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Produk ditambahkan ke keranjang!');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const filteredWishlist = products.filter(p => wishlist.includes(p.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#cb5094]/30 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wishlist Saya</h1>
        <p className="text-sm text-gray-600 mt-1">Produk favorit yang kamu simpan ({filteredWishlist.length} item)</p>
      </div>

      {filteredWishlist.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Wishlist Kosong</h2>
          <p className="text-sm text-gray-600 mb-6">Tambahkan produk favoritmu ke wishlist</p>
          <button
            onClick={() => navigate('/customer/products')}
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
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                >
                  <Heart className="w-4 h-4 fill-[#cb5094] text-[#cb5094]" />
                </button>

                {/* Discount Badge */}
                {product.diskon > 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    -{product.diskon}%
                  </div>
                )}

                {/* Rating */}
                {product.rating && (
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-800">{product.rating}</span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]">
                  {product.nama}
                </h3>
                
                <div className="mb-3">
                  {product.diskon > 0 ? (
                    <div>
                      <p className="text-lg font-bold text-[#cb5094]">
                        {formatPrice(product.hargaDasar * (1 - product.diskon / 100))}
                      </p>
                      <p className="text-xs text-gray-400 line-through">
                        {formatPrice(product.hargaDasar)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-[#cb5094]">
                      {formatPrice(product.hargaDasar)}
                    </p>
                  )}
                </div>

                {/* Stock Info */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500">
                    Stok: <span className="font-bold text-gray-700">{product.stok || 0}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.stok || product.stok === 0}
                    className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-2 rounded-xl text-xs font-bold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Beli</span>
                  </button>
                  
                  <button
                    onClick={() => navigate(`/customer/products/${product.id}`)}
                    className="px-3 py-2 border-2 border-[#cb5094] text-[#cb5094] rounded-xl text-xs font-bold hover:bg-pink-50 transition-all"
                  >
                    Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerWishlist;
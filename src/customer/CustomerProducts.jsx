import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Package, Heart, X, ShoppingCart, Truck, Shield, Check } from 'lucide-react';
import { productAPI, variantAPI } from '../utils/api';
import { formatPrice, getStatusLabel, getStatusColor } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerProducts() {
  const { searchQuery, setCartCount, setWishlistCount } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  // Load products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAll({
          active: true,
          limit: 100,
          sort: 'createdAt:desc'
        });

        const productList = response.data?.data || response.data || [];
        setProducts(productList.filter(p => p.aktif !== false));
      } catch (err) {
        console.error('Gagal memuat produk:', err);
        toast.error('Gagal memuat produk dari server');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);
  }, []);

  // Filter products by search query
  const filteredProducts = products.filter(p =>
    p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open product detail modal
  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    
    // Fetch variants
    try {
      console.log('Fetching variants for product:', product.id);
      const variantsResponse = await variantAPI.getByProductId(product.id, false);
      console.log('Variants response:', variantsResponse);
      
      const variantsData = variantsResponse.data?.data || variantsResponse.data || [];
      console.log('Variants data:', variantsData);
      
      setVariants(variantsData);
      
      // Auto-select first active variant
      const activeVariant = variantsData.find(v => v.aktif && v.stok > 0);
      if (activeVariant) {
        setSelectedVariant(activeVariant);
        console.log('Auto-selected variant:', activeVariant);
      } else {
        setSelectedVariant(null);
        console.log('No active variant with stock found');
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
      setSelectedVariant(null);
    }
  };

  // Close product detail modal
  const closeProductDetail = () => {
    setSelectedProduct(null);
    setVariants([]);
    setSelectedVariant(null);
    setQuantity(1);
  };

  // Add to cart
  const addToCart = (product, fromDetail = false) => {
    if (!product.aktif) {
      toast.error('Produk tidak tersedia');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (fromDetail && selectedVariant) {
      // Add variant to cart from detail modal
      const key = `${product.id}-${selectedVariant.id}`;
      const existingIndex = cart.findIndex(item => item.key === key);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          ...product,
          variantId: selectedVariant.id,
          variantName: `${selectedVariant.ukuran} - ${selectedVariant.warna}`,
          size: selectedVariant.ukuran,
          color: selectedVariant.warna,
          quantity,
          key,
          harga: selectedVariant.hargaOverride || product.hargaDasar
        });
      }
    } else if (fromDetail && !selectedVariant) {
      // Add product without variant from detail modal
      const key = `${product.id}-base`;
      const existingIndex = cart.findIndex(item => item.key === key);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          ...product,
          quantity,
          key,
          harga: product.hargaDasar
        });
      }
    } else {
      // Quick add from product card (ask for size)
      const size = prompt(`Pilih ukuran untuk ${product.nama}:`, 'M') || 'M';
      if (!size) return;

      const key = `${product.id}-${size}`;
      const existingIndex = cart.findIndex(item => item.key === key);

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          ...product,
          quantity: 1,
          size,
          key
        });
      }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalCount);
    
    toast.success(`${product.nama} ditambahkan ke keranjang!`);
    
    if (fromDetail) {
      closeProductDetail();
    }
  };

  // Toggle wishlist
  const toggleWishlist = (productId) => {
    let newWishlist;
    
    if (wishlist.includes(productId)) {
      newWishlist = wishlist.filter(id => id !== productId);
      toast.success('Dihapus dari wishlist');
    } else {
      newWishlist = [...wishlist, productId];
      toast.success('Ditambahkan ke wishlist');
    }

    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    setWishlistCount(newWishlist.length);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#cb5094]/30 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Koleksi Terbaru</h1>
        <p className="text-gray-600 mt-1">
          {filteredProducts.length > 0 
            ? `Menampilkan ${filteredProducts.length} produk`
            : searchQuery 
            ? `Tidak ada hasil untuk "${searchQuery}"`
            : 'Temukan fashion muslimah terbaik untukmu'
          }
        </p>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">Detail Produk</h2>
              <button
                onClick={closeProductDetail}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Image */}
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-square">
                  <img
                    src={selectedProduct.gambarUrl || 'https://via.placeholder.com/600?text=No+Image'}
                    alt={selectedProduct.nama}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600?text=No+Image';
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedProduct.status)}`}>
                      {getStatusLabel(selectedProduct.status)}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(selectedProduct.id);
                    }}
                    className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        wishlist.includes(selectedProduct.id)
                          ? 'fill-[#cb5094] text-[#cb5094]'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-pink-50 rounded-xl p-4 text-center">
                    <Truck className="w-6 h-6 text-[#cb5094] mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-700">Gratis Ongkir</div>
                    <div className="text-xs text-gray-500">Min. 100rb</div>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4 text-center">
                    <Shield className="w-6 h-6 text-[#cb5094] mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-700">Garansi</div>
                    <div className="text-xs text-gray-500">100% Original</div>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4 text-center">
                    <Check className="w-6 h-6 text-[#cb5094] mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-700">Terpercaya</div>
                    <div className="text-xs text-gray-500">Ribuan Review</div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-6">
                {/* Category */}
                {selectedProduct.category && (
                  <div className="inline-block bg-pink-100 text-[#cb5094] px-4 py-1 rounded-full text-sm font-bold">
                    {selectedProduct.category.nama}
                  </div>
                )}

                {/* Title */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedProduct.nama}</h1>
                  <code className="text-sm text-gray-500">{selectedProduct.slug}</code>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                  <div className="text-sm text-gray-600 mb-1">Harga</div>
                  <div className="text-4xl font-bold text-[#cb5094]">
                    {formatPrice(selectedVariant?.hargaOverride || selectedProduct.hargaDasar)}
                  </div>
                  {selectedProduct.berat && (
                    <div className="text-sm text-gray-500 mt-2">
                      Berat: {selectedProduct.berat}g
                    </div>
                  )}
                </div>

                {/* Variants */}
                {variants.length > 0 ? (
                  <div className="space-y-4">
                    <div className="font-bold text-gray-700">Pilih Varian:</div>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {variants.filter(v => v.aktif).map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          disabled={variant.stok === 0}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedVariant?.id === variant.id
                              ? 'border-[#cb5094] bg-pink-50'
                              : 'border-gray-200 hover:border-[#cb5094]'
                          } ${variant.stok === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                              {variant.ukuran}
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">
                              {variant.warna}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Stok: <span className="font-bold">{variant.stok}</span> pcs
                          </div>
                          {variant.sku && (
                            <div className="text-xs text-gray-400 mt-1 font-mono">
                              {variant.sku}
                            </div>
                          )}
                          {variant.hargaOverride && (
                            <div className="text-sm font-bold text-[#cb5094] mt-2">
                              {formatPrice(variant.hargaOverride)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 text-center pt-2 border-t">
                      {variants.filter(v => v.aktif).length} varian tersedia
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Produk ini belum memiliki varian. Anda tetap bisa menambahkan ke keranjang dengan ukuran default.
                    </p>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-2">
                  <div className="font-bold text-gray-700">Jumlah:</div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg font-bold hover:border-[#cb5094] transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const maxStock = selectedVariant?.stok || 999;
                        setQuantity(Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1)));
                      }}
                      className="w-20 text-center border-2 border-gray-300 rounded-lg px-4 py-2 font-bold focus:outline-none focus:border-[#cb5094]"
                    />
                    <button
                      onClick={() => {
                        const maxStock = selectedVariant?.stok || 999;
                        setQuantity(Math.min(maxStock, quantity + 1));
                      }}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg font-bold hover:border-[#cb5094] transition-all"
                    >
                      +
                    </button>
                    <div className="text-sm text-gray-500">
                      Tersedia: {selectedVariant?.stok || 999} pcs
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => addToCart(selectedProduct, true)}
                  disabled={
                    !selectedProduct.aktif || 
                    (variants.length > 0 && variants.some(v => v.aktif) && (!selectedVariant || selectedVariant.stok === 0))
                  }
                  className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {variants.length > 0 && variants.some(v => v.aktif) && !selectedVariant
                    ? 'Pilih Varian Terlebih Dahulu'
                    : 'Tambah ke Keranjang'
                  }
                </button>

                {/* Description */}
                {selectedProduct.deskripsi && (
                  <div className="border-t pt-6">
                    <h3 className="font-bold text-gray-800 mb-3">Deskripsi Produk</h3>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {selectedProduct.deskripsi}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-20 text-center">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {searchQuery ? 'Produk tidak ditemukan' : 'Belum Ada Produk'}
          </h2>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Coba kata kunci lain atau hapus filter pencarian' 
              : 'Admin sedang menambahkan koleksi baru untuk Anda'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Lihat Semua Produk
            </button>
          )}
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              onClick={() => openProductDetail(product)}
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={product.gambarUrl || 'https://via.placeholder.com/400?text=No+Image'}
                  alt={product.nama}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                  }}
                />
                
                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      wishlist.includes(product.id)
                        ? 'fill-[#cb5094] text-[#cb5094]'
                        : 'text-gray-600'
                    }`}
                  />
                </button>

                {/* Category Badge */}
                {product.category && (
                  <div className="absolute bottom-2 left-2 bg-[#cb5094] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                    {product.category.nama}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 h-10">
                  {product.nama}
                </h3>

                {/* Status */}
                <div className="mb-2">
                  <span className="text-xs text-gray-400">
                    {product.aktif ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Price */}
                <p className="text-lg font-bold text-[#cb5094] mb-3">
                  {formatPrice(product.hargaDasar)}
                </p>

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  disabled={!product.aktif}
                  className={`w-full py-2 rounded-lg text-sm font-bold transition-all transform ${
                    product.aktif
                      ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white hover:shadow-xl hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.aktif ? '+ Keranjang' : 'Tidak Tersedia'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerProducts;
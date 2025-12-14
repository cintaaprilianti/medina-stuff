import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Package, Heart, X, ShoppingCart, Truck, Shield, Check, ChevronLeft, ChevronRight, Grid, List, Sparkles } from 'lucide-react';
import { productAPI, variantAPI } from '../utils/api';
import { formatPrice, getStatusLabel, getStatusColor } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerProducts() {
  const { searchQuery, setCartCount, setWishlistCount } = useOutletContext();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);

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
        const activeProducts = productList.filter(p => p.aktif !== false);
        setProducts(activeProducts);
        
        const uniqueCategories = ['all', ...new Set(activeProducts.map(p => p.category?.nama).filter(Boolean))];
        setCategories(uniqueCategories);
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

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalCount);
  }, [setCartCount]);

  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCurrentImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedVariant(null);
    
    try {
      const variantsResponse = await variantAPI.getByProductId(product.id, false);
      const variantsData = variantsResponse.data?.data || variantsResponse.data || [];
      const activeVariants = variantsData.filter(v => v.aktif && v.stok > 0);
      
      setVariants(activeVariants);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
    }
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setVariants([]);
    setSelectedVariant(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setCurrentImageIndex(0);
  };

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

  const addToCart = () => {
    if (!selectedProduct.aktif) {
      toast.error('Produk tidak tersedia');
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (selectedVariant) {
      const key = `${selectedProduct.id}-${selectedVariant.id}`;
      const existingIndex = cart.findIndex(item => item.key === key);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          ...selectedProduct,
          variantId: selectedVariant.id,
          variantName: `${selectedVariant.ukuran} - ${selectedVariant.warna}`,
          size: selectedVariant.ukuran,
          color: selectedVariant.warna,
          quantity,
          key,
          harga: selectedVariant.hargaOverride || selectedProduct.hargaDasar
        });
      }
    } else {
      const key = `${selectedProduct.id}-base`;
      const existingIndex = cart.findIndex(item => item.key === key);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          ...selectedProduct,
          quantity,
          key,
          harga: selectedProduct.hargaDasar
        });
      }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalCount);
    
    toast.success(`${selectedProduct.nama} ditambahkan ke keranjang!`);
    closeProductDetail();
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (selectedColor) {
      const variant = variants.find(v => v.ukuran === size && v.warna === selectedColor);
      setSelectedVariant(variant || null);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (selectedSize) {
      const variant = variants.find(v => v.ukuran === selectedSize && v.warna === color);
      setSelectedVariant(variant || null);
    }
  };

  const getProductImages = (product) => {
    return product.gambarUrl?.split('|||').filter(url => url) || [];
  };

  const getUniqueValues = (key) => {
    return [...new Set(variants.filter(v => v.aktif).map(v => v[key]))];
  };

  const filteredProducts = products
    .filter(p => selectedCategory === 'all' || p.category?.nama === selectedCategory)
    .filter(p => 
      p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.hargaDasar - b.hargaDasar;
        case 'price-high':
          return b.hargaDasar - a.hargaDasar;
        case 'name':
          return a.nama.localeCompare(b.nama);
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-3 border-pink-100 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-t-[#cb5094] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-sm">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative mb-8 -mx-6 -mt-6 px-6 py-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Premium Collection 2025</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Our Products
            </h1>
 
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Temukan koleksi busana muslimah terbaru dengan kualitas premium dan desain elegan.
            </p>
    
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#cb5094]" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">100% Original</div>
                  <div className="text-xs text-white/80">Authentic</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#cb5094]" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Free Shipping</div>
                  <div className="text-xs text-white/80">Min. 100K</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#cb5094]" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Secure</div>
                  <div className="text-xs text-white/80">Protected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#cb5094] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#cb5094]'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#cb5094] bg-white"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>

              <div className="flex gap-1 bg-gray-50 p-1 rounded-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-gray-600 text-xs">
              {filteredProducts.length > 0 
                ? `Showing ${filteredProducts.length} products`
                : searchQuery 
                ? `No results for "${searchQuery}"`
                : 'No products available'
              }
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h2>
            <p className="text-gray-500 mb-4">Try different keywords or filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('newest');
              }}
              className="bg-[#cb5094] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#b44682] transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4" 
            : "space-y-4"
          }>
            {filteredProducts.map(product => {
              const images = getProductImages(product);
              const mainImage = images[0] || 'https://via.placeholder.com/400?text=No+Image';
              
              return viewMode === 'grid' ? (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#cb5094] transition-all duration-300 cursor-pointer"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="relative overflow-hidden aspect-[3/4]">
                    <img
                      src={mainImage}
                      alt={product.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=No+Image'}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          wishlist.includes(product.id)
                            ? 'fill-[#cb5094] text-[#cb5094]'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>

                    {product.category && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[#cb5094] px-2 py-1 rounded-lg text-xs font-semibold">
                        {product.category.nama}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[40px]">
                      {product.nama}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-[#cb5094]">
                        {formatPrice(product.hargaDasar)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#cb5094] transition-all cursor-pointer"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={mainImage}
                        alt={product.nama}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=No+Image'}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          {product.category && (
                            <span className="inline-block bg-[#cb5094]/10 text-[#cb5094] px-2 py-0.5 rounded text-xs font-semibold mb-1">
                              {product.category.nama}
                            </span>
                          )}
                          <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                            {product.nama}
                          </h3>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className="ml-2 flex-shrink-0"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              wishlist.includes(product.id)
                                ? 'fill-[#cb5094] text-[#cb5094]'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                        {product.deskripsi || 'Premium quality product'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-[#cb5094]">
                          {formatPrice(product.hargaDasar)}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openProductDetail(product);
                          }}
                          className="bg-[#cb5094] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#b44682] transition-all flex items-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center z-10 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Product Details</h2>
              <button
                onClick={closeProductDetail}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl bg-gray-50 aspect-square">
                  {(() => {
                    const images = getProductImages(selectedProduct);
                    const currentImage = images[currentImageIndex] || 'https://via.placeholder.com/600?text=No+Image';
                    
                    return (
                      <>
                        <img
                          src={currentImage}
                          alt={selectedProduct.nama}
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/600?text=No+Image'}
                        />
                        
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-800" />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-800" />
                            </button>
                            
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`h-1.5 rounded-full transition-all ${
                                    idx === currentImageIndex
                                      ? 'bg-[#cb5094] w-6'
                                      : 'bg-white/70 w-1.5'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(selectedProduct.id);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              wishlist.includes(selectedProduct.id)
                                ? 'fill-[#cb5094] text-[#cb5094]'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
                      </>
                    );
                  })()}
                </div>

                {(() => {
                  const images = getProductImages(selectedProduct);
                  if (images.length > 1) {
                    return (
                      <div className="grid grid-cols-4 gap-2">
                        {images.slice(0, 4).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`relative overflow-hidden rounded-lg aspect-square border-2 transition-all ${
                              idx === currentImageIndex
                                ? 'border-[#cb5094]'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="space-y-4">
                <div>
                  {selectedProduct.category && (
                    <span className="inline-block bg-pink-50 text-[#cb5094] px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-pink-100">
                      {selectedProduct.category.nama}
                    </span>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedProduct.nama}</h1>
                  <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{selectedProduct.slug}</code>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-pink-100">
                  <div className="text-xs text-gray-600 mb-1">Price</div>
                  <div className="text-3xl font-bold text-[#cb5094]">
                    {formatPrice(selectedVariant?.hargaOverride || selectedProduct.hargaDasar)}
                  </div>
                  {selectedProduct.berat && (
                    <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Weight: <span className="font-semibold">{selectedProduct.berat}g</span>
                    </div>
                  )}
                </div>

                {variants.length > 0 && (
                  <div className="space-y-3">
                    {getUniqueValues('ukuran').length > 0 && (
                      <div>
                        <div className="font-semibold text-gray-800 text-sm mb-2">Size {selectedSize && <span className="text-[#cb5094]">• {selectedSize}</span>}</div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('ukuran').map(size => {
                            const hasStock = variants.some(v => v.ukuran === size && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={size}
                                onClick={() => handleSizeSelect(size)}
                                disabled={!hasStock}
                                className={`min-w-[60px] px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  selectedSize === size
                                    ? 'bg-[#cb5094] text-white'
                                    : hasStock
                                    ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {getUniqueValues('warna').length > 0 && (
                      <div>
                        <div className="font-semibold text-gray-800 text-sm mb-2">Color {selectedColor && <span className="text-[#cb5094]">• {selectedColor}</span>}</div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('warna').map(color => {
                            const hasStock = variants.some(v => v.warna === color && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                disabled={!hasStock}
                                className={`min-w-[70px] px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  selectedColor === color
                                    ? 'bg-[#cb5094] text-white'
                                    : hasStock
                                    ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                                }`}
                              >
                                {color}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedVariant && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600 mb-0.5">Stock Available</div>
                            <div className="text-lg font-bold text-green-600">
                              {selectedVariant.stok} pcs
                            </div>
                          </div>
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                      </div>
                    )}

                    {selectedSize && selectedColor && !selectedVariant && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <div className="text-sm font-semibold text-red-600">
                          This combination is not available
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="font-semibold text-gray-800 text-sm">Quantity</div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 border border-gray-300 rounded-lg font-bold hover:border-[#cb5094] hover:text-[#cb5094] transition-all"
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
                      className="w-16 text-center border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#cb5094]"
                    />
                    <button
                      onClick={() => {
                        const maxStock = selectedVariant?.stok || 999;
                        setQuantity(Math.min(maxStock, quantity + 1));
                      }}
                      className="w-9 h-9 border border-gray-300 rounded-lg font-bold hover:border-[#cb5094] hover:text-[#cb5094] transition-all"
                    >
                      +
                    </button>
                    <div className="text-xs text-gray-500">
                      Max: {selectedVariant?.stok || 999}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-0.5">Subtotal</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice((selectedVariant?.hargaOverride || selectedProduct.hargaDasar) * quantity)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{quantity} item(s)</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={addToCart}
                    disabled={
                      !selectedProduct.aktif || 
                      (variants.length > 0 && (!selectedVariant || selectedVariant.stok === 0))
                    }
                    className="w-full bg-[#cb5094] text-white py-3 rounded-full font-semibold hover:bg-[#b44682] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {variants.length > 0 && !selectedVariant
                      ? 'Select Variant First'
                      : 'Add to Cart'
                    }
                  </button>

                  <button
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className="w-full border border-[#cb5094] text-[#cb5094] py-3 rounded-full font-semibold hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                    {wishlist.includes(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>

                {selectedProduct.deskripsi && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Description</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.deskripsi}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProducts;
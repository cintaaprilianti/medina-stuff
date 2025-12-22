import { useState, useEffect, useLayoutEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Package, Heart, X, ShoppingCart, Truck, Shield, Check, ChevronLeft, ChevronRight, 
  Search, Grid, List, Clock, CheckCircle, Filter, ChevronDown, Zap, Award
} from 'lucide-react';
import { productAPI, variantAPI } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
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
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [colorImages, setColorImages] = useState({});
  const [viewMode, setViewMode] = useState('grid');

  // CACHING: Cache produk di localStorage selama 15 menit
  const PRODUCTS_CACHE_KEY = 'cached_products_v4';
  const CACHE_DURATION = 15 * 60 * 1000; // 15 menit

  // Update cart count SEBELUM render pertama (hilangkan glitch quantity saat refresh)
  useLayoutEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  }, [setCartCount]);

  useEffect(() => {
    const fetchProducts = async () => {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        try {
          const { data, categories: cachedCategories, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setProducts(data);
            setCategories(cachedCategories);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Cache corrupted, fetching fresh data');
          localStorage.removeItem(PRODUCTS_CACHE_KEY);
        }
      }

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

        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
          data: activeProducts,
          categories: uniqueCategories,
          timestamp: Date.now()
        }));
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

  // Load wishlist & cart count
  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);
    setWishlistCount(savedWishlist.length);
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  }, [setCartCount, setWishlistCount]);

  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCurrentImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedVariant(null);
    
    const savedColorImages = localStorage.getItem(`colorImages-${product.id}`);
    if (savedColorImages) {
      try {
        const parsed = JSON.parse(savedColorImages);
        setColorImages(parsed);
      } catch (e) {
        console.error('Failed to parse colorImages', e);
        setColorImages({});
      }
    } else {
      setColorImages({});
    }
    
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
    setColorImages({});
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

  const addToCart = (goToCheckout = false) => {
    if (!selectedProduct.aktif) {
      toast.error('Produk tidak tersedia');
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Tentukan stok maksimal
    const maxStock = selectedVariant ? selectedVariant.stok : (selectedProduct.stok || 999);

    if (selectedVariant) {
      const existingIndex = cart.findIndex(
        item => item.id === selectedProduct.id && item.variantId === selectedVariant.id
      );
      
      if (existingIndex >= 0) {
        const currentQty = cart[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs. Tidak bisa menambah lebih!`);
          return;
        }

        cart[existingIndex].quantity = newQty;
        toast.success(`Quantity updated! Total: ${newQty} items`);
      } else {
        if (quantity > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs`);
          return;
        }

        const variantImageUrl = colorImages[selectedVariant.warna] || null;

        cart.push({
          id: selectedProduct.id,
          nama: selectedProduct.nama,
          gambarUrl: selectedProduct.gambarUrl,
          category: selectedProduct.category,
          variantId: selectedVariant.id,
          variantName: `${selectedVariant.ukuran} - ${selectedVariant.warna}`,
          size: selectedVariant.ukuran,
          color: selectedVariant.warna,
          quantity,
          harga: selectedVariant.hargaOverride || selectedProduct.hargaDasar,
          aktif: selectedProduct.aktif,
          stok: selectedVariant.stok,
          variantImageUrl: variantImageUrl
        });
        toast.success(`${selectedProduct.nama} ditambahkan ke keranjang!`);
      }
    } else {
      const existingIndex = cart.findIndex(
        item => item.id === selectedProduct.id && !item.variantId
      );
      
      if (existingIndex >= 0) {
        const currentQty = cart[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs. Tidak bisa menambah lebih!`);
          return;
        }

        cart[existingIndex].quantity = newQty;
        toast.success(`Quantity updated! Total: ${newQty} items`);
      } else {
        if (quantity > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs`);
          return;
        }
        cart.push({
          id: selectedProduct.id,
          nama: selectedProduct.nama,
          gambarUrl: selectedProduct.gambarUrl,
          category: selectedProduct.category,
          quantity,
          harga: selectedProduct.hargaDasar,
          aktif: selectedProduct.aktif,
          stok: selectedProduct.stok || 999
        });
        toast.success(`${selectedProduct.nama} ditambahkan ke keranjang!`);
      }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.length);
    
    closeProductDetail();

    if (goToCheckout) {
      navigate('/customer/checkout');
    }
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
    
    const colorImageUrl = colorImages[color];
    if (colorImageUrl) {
      const productImages = getSortedProductImages(selectedProduct);
      const imageIndex = productImages.findIndex(img => {
        const imgTrimmed = img.trim();
        const colorImgTrimmed = colorImageUrl.trim();
        return imgTrimmed === colorImgTrimmed || 
               imgTrimmed.includes(colorImgTrimmed) || 
               colorImgTrimmed.includes(imgTrimmed);
      });
      
      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
      }
    }
  };

  const getCurrentColorLabel = () => {
    if (!selectedProduct) return '';
    
    const images = getSortedProductImages(selectedProduct);
    const currentImage = images[currentImageIndex];
    
    if (!currentImage) return '';
    
    for (const [color, imageUrl] of Object.entries(colorImages)) {
      const imgTrimmed = currentImage.trim();
      const colorImgTrimmed = imageUrl.trim();
      if (imgTrimmed === colorImgTrimmed || 
          imgTrimmed.includes(colorImgTrimmed) || 
          colorImgTrimmed.includes(imgTrimmed)) {
        return color;
      }
    }
    
    return '';
  };

  const getProductImages = (product) => {
    return product.gambarUrl?.split('|||').filter(url => url) || [];
  };

  const getSortedProductImages = (product) => {
    const allImages = product.gambarUrl?.split('|||').filter(url => url) || [];
    
    if (Object.keys(colorImages).length === 0) {
      return allImages;
    }
    
    const sortedImages = [];
    const usedImages = new Set();
    
    const uniqueColors = [...new Set(variants.map(v => v.warna))];
    uniqueColors.forEach(color => {
      const imageUrl = colorImages[color];
      if (imageUrl) {
        const imgIndex = allImages.findIndex(img => {
          const imgTrimmed = img.trim();
          const colorImgTrimmed = imageUrl.trim();
          return imgTrimmed === colorImgTrimmed || 
                 imgTrimmed.includes(colorImgTrimmed) || 
                 colorImgTrimmed.includes(imgTrimmed);
        });
        
        if (imgIndex !== -1 && !usedImages.has(allImages[imgIndex])) {
          sortedImages.push(allImages[imgIndex]);
          usedImages.add(allImages[imgIndex]);
        }
      }
    });
    
    allImages.forEach(img => {
      if (!usedImages.has(img)) {
        sortedImages.push(img);
      }
    });
    
    return sortedImages.length > 0 ? sortedImages : allImages;
  };

  const getUniqueValues = (key) => {
    return [...new Set(variants.filter(v => v.aktif).map(v => v[key]))];
  };

  const isPreOrder = (product) => {
    return product.preOrder === true || product.isPreOrder === true;
  };

  const isReadyStock = (product) => {
    return !isPreOrder(product) && product.aktif === true;
  };

  const combinedSearchQuery = searchQuery || localSearchQuery;

  // Filter & Sort
  const filteredProducts = products
    .filter(p => {
      // Filter by search query
      if (combinedSearchQuery) {
        const query = combinedSearchQuery.toLowerCase().trim();
        const nama = p.nama?.toLowerCase() || '';
        if (!nama.includes(query)) return false;
      }
      
      // Filter by category
      if (selectedCategory !== 'all') {
        if (p.category?.nama !== selectedCategory) return false;
      }
      
      return true;
    })
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
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-white to-[#f9f6f0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12">
          <div className="text-center">
            <div className="h-12 bg-gray-200 rounded-full w-96 mx-auto animate-pulse mb-4"></div>
            <div className="h-8 bg-gray-200 rounded-full w-72 mx-auto animate-pulse mb-6"></div>
            <div className="flex justify-center gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-white to-[#f9f6f0]">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 overflow-hidden bg-gradient-to-br from-[#fef5fb] via-[#fef9f5] to-[#fff8f0]">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-[#cb5094]/20 via-[#d4b896]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 left-1/3 w-[300px] h-[300px] bg-gradient-to-tr from-[#d4b896]/15 via-[#cb5094]/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-[#cb5094]/20">
              <Award className="w-4 h-4 text-[#cb5094] animate-pulse" />
              <span className="text-xs font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                Premium Collection
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-[#cb5094] via-[#e570b3] to-[#cb5094] bg-clip-text text-transparent animate-gradient">
                Koleksi Busana Muslim
              </span>
              <br />
              <span className="text-gray-800">Penuh Berkah dan Gaya</span>
            </h1>

            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk impianmu..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-3.5 rounded-full bg-white/90 backdrop-blur-md text-gray-800 text-base focus:outline-none focus:ring-4 focus:ring-[#cb5094]/30 shadow-2xl border border-[#cb5094]/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-[#cb5094]/10 p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    cat === selectedCategory
                      ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'Semua Produk' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-[#cb5094] bg-white"
              >
                <option value="newest">Terbaru</option>
                <option value="price-low">Harga Terendah</option>
                <option value="price-high">Harga Tertinggi</option>
                <option value="name">Nama A-Z</option>
              </select>

              <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}>
                  <Grid className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Produk tidak ditemukan</h3>
            <p className="text-gray-500">Coba kata kunci atau filter lain</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map(product => {
              const images = getProductImages(product);
              const mainImg = images[0] || 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image';

              return (
                <div
                  key={product.id}
                  onClick={() => openProductDetail(product)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                    <img
                      src={mainImg}
                      alt={product.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => e.target.src = 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image'}
                    />
                    {product.category && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-full">
                          {product.category.nama}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">
                      {product.nama}
                    </h3>
                    <div className="text-2xl font-bold text-[#cb5094]">
                      {formatPrice(product.hargaDasar)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => {
              const images = getProductImages(product);
              const mainImg = images[0] || 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image';

              return (
                <div
                  key={product.id}
                  onClick={() => openProductDetail(product)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex cursor-pointer"
                >
                  <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                    <img
                      src={mainImg}
                      alt={product.nama}
                      className="w-full h-full object-cover"
                      onError={e => e.target.src = 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image'}
                    />
                  </div>

                  <div className="flex-1 p-4 sm:p-6">
                    {product.category && (
                      <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full mb-2">
                        {product.category.nama}
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {product.nama}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.deskripsi || 'Premium quality muslimah fashion'}
                    </p>
                    <div className="text-2xl font-bold text-[#cb5094]">
                      {formatPrice(product.hargaDasar)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] backdrop-blur-md px-6 py-5 flex justify-between items-center z-10 border-b-2 border-[#cb5094]/10">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">Detail Produk</h2>
              <button
                onClick={closeProductDetail}
                className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-all shadow-md border-2 border-[#cb5094]/20"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square border-2 border-[#cb5094]/10">
                  {(() => {
                    const images = getSortedProductImages(selectedProduct);
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
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all"
                            >
                              <ChevronLeft className="w-5 h-5 text-gray-800" />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all"
                            >
                              <ChevronRight className="w-5 h-5 text-gray-800" />
                            </button>
                            
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`h-2 rounded-full transition-all ${
                                    idx === currentImageIndex
                                      ? 'bg-[#cb5094] w-8'
                                      : 'bg-white/70 w-2'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <div className="absolute top-4 left-4">
                          {isPreOrder(selectedProduct) ? (
                            <div className="bg-gradient-to-r from-[#d4b896] to-[#e5c9a6] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Pre Order
                            </div>
                          ) : isReadyStock(selectedProduct) ? (
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Ready Stock
                            </div>
                          ) : null}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {(() => {
                  const images = getSortedProductImages(selectedProduct);
                  if (images.length > 1) {
                    return (
                      <div className="grid grid-cols-4 gap-3">
                        {images.slice(0, 4).map((img, idx) => {
                          let colorLabel = '';
                          for (const [color, imageUrl] of Object.entries(colorImages)) {
                            const imgTrimmed = img.trim();
                            const colorImgTrimmed = imageUrl.trim();
                            if (imgTrimmed === colorImgTrimmed || 
                                imgTrimmed.includes(colorImgTrimmed) || 
                                colorImgTrimmed.includes(imgTrimmed)) {
                              colorLabel = color;
                              break;
                            }
                          }
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`relative overflow-hidden rounded-xl aspect-square border-2 transition-all group ${
                                idx === currentImageIndex
                                  ? 'border-[#cb5094] shadow-lg scale-105'
                                  : 'border-[#cb5094]/20 hover:border-[#cb5094]/40'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              {colorLabel && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-[9px] font-bold text-center truncate">{colorLabel}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                })()}

                {(() => {
                  const currentColorInfo = getCurrentColorLabel();
                  
                  if (currentColorInfo) {
                    return (
                      <div className="bg-gradient-to-r from-[#fef5fb] to-white rounded-xl p-4 border-2 border-[#cb5094]/10">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#cb5094] to-[#d85fa8]"></div>
                          <p className="text-sm font-bold text-gray-700">
                            Sedang melihat: <span className="text-[#cb5094]">{currentColorInfo}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                })()}

                {selectedProduct.deskripsi && (
                  <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-[#cb5094] to-[#d85fa8] rounded-full"></div>
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.deskripsi}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  {selectedProduct.category && (
                    <span className="inline-block bg-gradient-to-r from-[#cb5094]/10 to-[#d4b896]/10 text-[#cb5094] px-4 py-1.5 rounded-xl text-xs font-bold mb-3 border-2 border-[#cb5094]/20">
                      {selectedProduct.category.nama}
                    </span>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{selectedProduct.nama}</h1>
                </div>

                <div className="bg-gradient-to-br from-[#fef5fb] to-white rounded-2xl p-5 border-2 border-[#cb5094]/20 shadow-md">
                  <div className="text-xs text-gray-600 mb-1 font-semibold">Harga</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                    {formatPrice(selectedVariant?.hargaOverride || selectedProduct.hargaDasar)}
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-4">
                    {getUniqueValues('ukuran').length > 0 && (
                      <div>
                        <div className="font-bold text-gray-800 text-sm mb-3">
                          Ukuran {selectedSize && <span className="text-[#cb5094] ml-1">• {selectedSize}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('ukuran').map(size => {
                            const hasStock = variants.some(v => v.ukuran === size && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={size}
                                onClick={() => handleSizeSelect(size)}
                                disabled={!hasStock}
                                className={`min-w-[70px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  selectedSize === size
                                    ? 'bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg'
                                    : hasStock
                                    ? 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100'
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
                        <div className="font-bold text-gray-800 text-sm mb-3">
                          Warna {selectedColor && <span className="text-[#cb5094] ml-1">• {selectedColor}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('warna').map(color => {
                            const hasStock = variants.some(v => v.warna === color && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                disabled={!hasStock}
                                className={`min-w-[80px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  selectedColor === color
                                    ? 'bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg'
                                    : hasStock
                                    ? 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100'
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
                      <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600 mb-1 font-semibold">Stok Tersedia</div>
                            <div className="text-xl font-bold text-green-600">
                              {selectedVariant.stok} pcs
                            </div>
                          </div>
                          <Check className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                    )}

                    {selectedSize && selectedColor && !selectedVariant && (
                      <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-sm font-bold text-red-600">
                          Kombinasi ini tidak tersedia
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="font-bold text-gray-800 text-sm">Jumlah</div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border-2 border-[#cb5094]/30 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#d85fa8] hover:text-white hover:border-transparent transition-all"
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
                      className="w-20 text-center border-2 border-[#cb5094]/30 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#cb5094]"
                    />
                    <button
                      onClick={() => {
                        const maxStock = selectedVariant?.stok || 999;
                        setQuantity(Math.min(maxStock, quantity + 1));
                      }}
                      className="w-10 h-10 border-2 border-[#cb5094]/30 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#d85fa8] hover:text-white hover:border-transparent transition-all"
                    >
                      +
                    </button>
                    <div className="text-xs text-gray-500 font-semibold">
                      Maks: {selectedVariant?.stok || 999}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1 font-semibold">Subtotal</div>
                      <div className="text-4xl font-bold text-gray-900">
                        {formatPrice((selectedVariant?.hargaOverride || selectedProduct.hargaDasar) * quantity)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 font-semibold">{quantity} item</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => addToCart(true)}
                    disabled={
                      !selectedProduct.aktif || 
                      (variants.length > 0 && (!selectedVariant || selectedVariant.stok === 0))
                    }
                    className="w-full bg-gradient-to-r from-[#cb5094] to-[#d85fa8] hover:from-[#b44682] hover:to-[#c54e96] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-[#cb5094]/40"
                  >
                    <Zap className="w-6 h-6" />
                    <span className="text-lg">Beli Sekarang</span>
                  </button>

                  <button
                    onClick={() => addToCart(false)}
                    disabled={
                      !selectedProduct.aktif || 
                      (variants.length > 0 && (!selectedVariant || selectedVariant.stok === 0))
                    }
                    className="w-full border-2 border-[#cb5094] text-[#cb5094] py-4 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Tambah ke Keranjang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProducts;
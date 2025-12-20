import { useState, useEffect, useLayoutEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Package, Heart, X, ShoppingCart, Truck, Shield, Check, ChevronLeft, ChevronRight, Search, Clock, CheckCircle, Filter, ChevronDown } from 'lucide-react';
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
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [colorImages, setColorImages] = useState({});
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [appliedCategories, setAppliedCategories] = useState([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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

  const addToCart = () => {
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

        // ★ PERBAIKAN UTAMA: Simpan gambar spesifik untuk warna yang dipilih
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
          variantImageUrl: variantImageUrl  // ← INI YANG BIKIN GAMBAR DI KERANJANG SESUAI WARNA!
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

  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);

  const handleCategoryToggle = (category) => {
    if (tempSelectedCategories.includes(category)) {
      setTempSelectedCategories(tempSelectedCategories.filter(c => c !== category));
    } else {
      setTempSelectedCategories([...tempSelectedCategories, category]);
    }
  };

  const applyFilters = () => {
    setAppliedCategories(tempSelectedCategories);
    setShowCategoryFilter(false);
  };

  const clearAllFilters = () => {
    setTempSelectedCategories([]);
    setAppliedCategories([]);
  };

  useEffect(() => {
    if (showCategoryFilter) {
      setTempSelectedCategories(appliedCategories);
    }
  }, [showCategoryFilter, appliedCategories]);

  // Search hanya berdasarkan awalan nama produk (super akurat)
  const filteredProducts = products
    .filter(p => {
      if (appliedCategories.length === 0) return true;
      return appliedCategories.includes(p.category?.nama);
    })
    .filter(p => {
      if (!combinedSearchQuery) return true;
      
      const query = combinedSearchQuery.toLowerCase().trim();
      const nama = p.nama?.toLowerCase() || '';
      
      return nama.startsWith(query);
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
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-white to-[#f9f6f0] -m-6 lg:-m-10">
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .animate-pulse-slow {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>

        {/* Header skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#fef5fb] via-[#fef9f5] to-[#fff8f0] pb-12">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12">
            <div className="text-center">
              <div className="h-12 bg-gray-200 rounded-full w-96 mx-auto animate-pulse-slow mb-4"></div>
              <div className="h-8 bg-gray-200 rounded-full w-72 mx-auto animate-pulse-slow mb-6"></div>
              <div className="flex justify-center gap-4">
                <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse-slow"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse-slow"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse-slow"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto">
          {/* Filter bar skeleton */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="h-14 bg-gray-200 rounded-full w-48 animate-pulse-slow"></div>
            <div className="h-14 bg-gray-200 rounded-full flex-1 animate-pulse-slow"></div>
            <div className="h-14 bg-gray-200 rounded-full w-48 animate-pulse-slow"></div>
          </div>

          {/* Product grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse-slow"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-4/5 animate-pulse-slow"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5 animate-pulse-slow"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse-slow mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-white to-[#f9f6f0] -m-6 lg:-m-10">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #cb5094, #d4b896);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #b44682, #c5a887);
        }
      `}</style>

      {/* Ultra Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fef5fb] via-[#fef9f5] to-[#fff8f0]">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#cb5094]/20 via-[#d4b896]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-[#d4b896]/15 via-[#cb5094]/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#cb5094] rounded-full animate-ping"></div>
          <div className="absolute top-2/3 left-1/2 w-1.5 h-1.5 bg-[#d4b896] rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#cb5094] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-center py-6">
              <div className="text-center max-w-3xl">
                <div className="inline-flex items-center gap-2 mb-3 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094] to-[#d4b896] rounded-full blur-sm opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative bg-white/70 backdrop-blur-md border border-white/50 px-3 py-1 rounded-full shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#cb5094] to-[#d4b896] rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold bg-gradient-to-r from-[#cb5094] to-[#d4b896] bg-clip-text text-transparent tracking-wider uppercase">
                        Since 2019 | Terpercaya & Berkualitas
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 mb-3">
                  <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-[#2d2d2d] to-[#5d5d5d] bg-clip-text text-transparent">
                      Koleksi Busana Muslim
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#cb5094] via-[#d85fa8] to-[#d4b896] mt-1">
                      Penuh Berkah dan Gaya
                    </span>
                  </h1>
                  
                  <p className="text-[#6b6b6b] text-sm leading-relaxed max-w-2xl mx-auto mt-2">
                    Tampil percaya diri dengan busana berkualitas tinggi
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094]/20 to-[#d4b896]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white/40 px-2.5 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#cb5094] to-[#d85fa8] flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] text-[#3d3d3d] font-semibold">Premium Quality</span>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094]/20 to-[#d4b896]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white/40 px-2.5 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#d4b896] to-[#e5c9a6] flex items-center justify-center shadow-sm">
                        <Truck className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] text-[#3d3d3d] font-semibold">Free Shipping</span>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094]/20 to-[#d4b896]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white/40 px-2.5 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#cb5094] to-[#d4b896] flex items-center justify-center shadow-sm">
                        <Shield className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] text-[#3d3d3d] font-semibold">Secure Payment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#cb5094]/40 to-transparent"></div>
      </div>

      <div className="px-6 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto">
        {/* Modern Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Category Filter Button with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="group relative h-[56px] px-6 bg-white hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white rounded-full border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40 transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#cb5094] to-[#d85fa8] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Filter className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-bold text-gray-800">Categories</span>
                {appliedCategories.length > 0 && (
                  <div className="w-6 h-6 bg-gradient-to-br from-[#cb5094] to-[#d85fa8] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs font-bold text-white">{appliedCategories.length}</span>
                  </div>
                )}
              </button>

              {/* Category Filter Dropdown */}
              {showCategoryFilter && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4" 
                    onClick={() => setShowCategoryFilter(false)}
                  >
                    <div 
                      className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-br from-[#fef5fb] to-white px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                            Filter Categories
                          </h3>
                          <button
                            onClick={() => setShowCategoryFilter(false)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        {appliedCategories.length > 0 && (
                          <button
                            onClick={() => clearAllFilters()}
                            className="text-xs text-[#cb5094] hover:text-[#d85fa8] font-semibold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Categories List */}
                      <div className="max-h-[420px] overflow-y-auto p-4">
                        <div className="space-y-2">
                          {categories.filter(cat => cat !== 'all').map(category => {
                            const isSelected = tempSelectedCategories.includes(category);
                            const productCount = products.filter(p => p.category?.nama === category).length;
                            
                            return (
                              <button
                                key={category}
                                onClick={() => handleCategoryToggle(category)}
                                className={`w-full group relative px-5 py-3.5 rounded-full text-left transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#cb5094] to-[#d85fa8] shadow-lg shadow-[#cb5094]/25'
                                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-[#cb5094]/20'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-white border-white'
                                        : 'border-gray-300 group-hover:border-[#cb5094]/40'
                                    }`}>
                                      {isSelected && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#cb5094] to-[#d85fa8]"></div>
                                      )}
                                    </div>
                                    <span className={`text-sm font-bold ${
                                      isSelected ? 'text-white' : 'text-gray-700'
                                    }`}>
                                      {category}
                                    </span>
                                  </div>
                                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-white text-gray-600'
                                  }`}>
                                    {productCount}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-100 p-4 bg-gradient-to-br from-[#fef5fb]/30 to-white">
                        <div className="flex gap-2">
                          {tempSelectedCategories.length > 0 && (
                            <button
                              onClick={() => setTempSelectedCategories([])}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-full font-bold transition-all"
                            >
                              Reset
                            </button>
                          )}
                          <button
                            onClick={applyFilters}
                            className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white py-3.5 rounded-full font-bold hover:shadow-xl hover:scale-[1.02] transition-all shadow-lg"
                          >
                            {tempSelectedCategories.length > 0 
                              ? `Apply (${tempSelectedCategories.length})`
                              : 'Close'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Search Bar - Flexible Width */}
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094]/15 via-[#d85fa8]/15 to-[#d4b896]/15 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative bg-white rounded-full border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40 shadow-lg hover:shadow-xl transition-all duration-300 h-[56px]">
                <div className="flex items-center h-full">
                  <div className="pl-5 pr-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#cb5094] to-[#d85fa8] flex items-center justify-center shadow-md">
                      <Search className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="flex-1 h-full pr-4 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm font-medium"
                  />
                  {localSearchQuery && (
                    <button
                      onClick={() => setLocalSearchQuery('')}
                      className="mr-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sort Dropdown - Custom Design */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="group relative h-[56px] px-6 bg-white hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white rounded-full border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40 transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
              >
                <span className="text-sm font-bold text-gray-800">
                  {sortBy === 'newest' && 'Newest'}
                  {sortBy === 'price-low' && 'Price: Low'}
                  {sortBy === 'price-high' && 'Price: High'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#cb5094] transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort Dropdown Menu */}
              {showSortDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSortDropdown(false)}
                  ></div>
                  <div className="absolute top-full right-0 mt-3 w-[220px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                    <div className="p-2">
                      {[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'price-low', label: 'Price: Low to High' },
                        { value: 'price-high', label: 'Price: High to Low' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full px-5 py-3.5 rounded-full text-left transition-all text-sm font-bold ${
                            sortBy === option.value
                              ? 'bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Applied Filters Tags */}
          {appliedCategories.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full">
                {appliedCategories.length} active
              </span>
              {appliedCategories.map(category => (
                <div
                  key={category}
                  className="group flex items-center gap-2 bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <span>{category}</span>
                  <button
                    onClick={() => handleCategoryToggle(category)}
                    className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                  >
                    <X className="w-2.5 h-2.5" strokeWidth={3} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => clearAllFilters()}
                className="text-xs font-semibold text-[#cb5094] hover:text-[#d85fa8] px-3 py-1.5 bg-[#fef5fb] hover:bg-[#fef5fb]/80 rounded-full transition-all"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-gradient-to-br from-white/90 via-white/80 to-[#fef5fb]/50 backdrop-blur-sm rounded-2xl shadow-md border-2 border-[#cb5094]/10 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#cb5094]/10 to-[#d4b896]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-[#cb5094]/50" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">We couldn't find any products matching your criteria. Try adjusting your filters.</p>
            <button
              onClick={() => {
                clearAllFilters();
                setSortBy('newest');
                setLocalSearchQuery('');
              }}
              className="bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white px-8 py-3 rounded-xl text-sm font-semibold hover:shadow-xl hover:scale-105 transition-all shadow-lg shadow-[#cb5094]/30"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredProducts.map(product => {
              const images = getProductImages(product);
              const mainImage = images[0] || 'https://via.placeholder.com/400?text=No+Image';
              const productIsPreOrder = isPreOrder(product);
              const productIsReadyStock = isReadyStock(product);
              
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl shadow-md border-2 border-[#cb5094]/10 overflow-hidden hover:shadow-2xl hover:border-[#cb5094]/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="relative overflow-hidden aspect-[3/4]">
                    <img
                      src={mainImage}
                      alt={product.nama}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=No+Image'}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
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

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                        {formatPrice(product.hargaDasar)}
                      </div>
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
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">Product Details</h2>
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
                            Currently viewing: <span className="text-[#cb5094]">{currentColorInfo}</span>
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
                      Description
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
                  <div className="text-xs text-gray-600 mb-1 font-semibold">Price</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                    {formatPrice(selectedVariant?.hargaOverride || selectedProduct.hargaDasar)}
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-4">
                    {getUniqueValues('ukuran').length > 0 && (
                      <div>
                        <div className="font-bold text-gray-800 text-sm mb-3">
                          Size {selectedSize && <span className="text-[#cb5094] ml-1">• {selectedSize}</span>}
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
                          Color {selectedColor && <span className="text-[#cb5094] ml-1">• {selectedColor}</span>}
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
                            <div className="text-xs text-gray-600 mb-1 font-semibold">Stock Available</div>
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
                          This combination is not available
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="font-bold text-gray-800 text-sm">Quantity</div>
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
                      Max: {selectedVariant?.stok || 999}
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
                      <div className="text-sm text-gray-500 font-semibold">{quantity} item(s)</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={addToCart}
                    disabled={
                      !selectedProduct.aktif || 
                      (variants.length > 0 && (!selectedVariant || selectedVariant.stok === 0))
                    }
                    className="w-full bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#cb5094]/30"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {variants.length > 0 && !selectedVariant
                      ? 'Select Variant First'
                      : 'Add to Cart'
                    }
                  </button>

                  <button
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className="w-full border-2 border-[#cb5094] text-[#cb5094] py-4 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white transition-all flex items-center justify-center gap-2"
                  >
                    <Heart className={`w-5 h-5 ${wishlist.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                    {wishlist.includes(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
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
import { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerCart() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
  const navigate = useNavigate();
  const { setCartCount } = useOutletContext();

  useLayoutEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  }, [setCartCount]);

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      const mergedCart = [];
      cart.forEach(item => {
        const itemSize = item.ukuran || item.size || '';
        const itemColor = item.warna || item.color || '';
        
        const existingIndex = mergedCart.findIndex(existing => {
          const existingSize = existing.ukuran || existing.size || '';
          const existingColor = existing.warna || existing.color || '';
          
          return (
            existing.id === item.id && 
            existingSize === itemSize && 
            existingColor === itemColor &&
            existing.variantId === item.variantId
          );
        });

        if (existingIndex >= 0) {
          mergedCart[existingIndex].quantity += item.quantity;
        } else {
          const standardizedItem = {
            ...item,
            ukuran: itemSize,
            warna: itemColor
          };
          delete standardizedItem.size;
          delete standardizedItem.color;
          
          mergedCart.push(standardizedItem);
        }
      });

      localStorage.setItem('cart', JSON.stringify(mergedCart));
      
      setCartItems(mergedCart);
      setCartCount(mergedCart.length);
      setSelectedItems(mergedCart.map((_, i) => i));
    };

    loadCart();

    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [setCartCount]);

  const toggleSelectItem = (index) => {
    setSelectedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((_, i) => i));
    }
  };

  const updateQuantity = (index, change) => {
    const cart = [...cartItems];
    const item = cart[index];
    const currentQty = item.quantity;
    const newQty = currentQty + change;

    const maxStock = item.stok ?? 999;

    if (change > 0 && newQty > maxStock) {
      toast.error(`Stok tersedia hanya ${maxStock} pcs`);
      return;
    }

    item.quantity = Math.max(1, newQty);

    localStorage.setItem('cart', JSON.stringify(cart));
    setCartItems(cart);
    setCartCount(cart.length);
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Jumlah diperbarui');
  };

  const confirmRemoveFromCart = (index) => {
    setDeleteConfirmIndex(index);
  };

  const cancelDelete = () => {
    setDeleteConfirmIndex(null);
  };

  const executeRemoveFromCart = () => {
    if (deleteConfirmIndex === null) return;

    const cart = cartItems.filter((_, i) => i !== deleteConfirmIndex);
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartItems(cart);
    setCartCount(cart.length);
    setSelectedItems(prev => prev.filter(i => i !== deleteConfirmIndex).map(i => i > deleteConfirmIndex ? i - 1 : i));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Produk dihapus dari keranjang');
    setDeleteConfirmIndex(null);
  };

  const getSelectedItems = () => {
    return cartItems.filter((_, index) => selectedItems.includes(index));
  };

  const getTotalPrice = () => {
    const selected = getSelectedItems();
    return selected.reduce((sum, item) => sum + item.harga * item.quantity, 0);
  };

  const getTotalQuantity = () => {
    const selected = getSelectedItems();
    return selected.reduce((sum, item) => sum + item.quantity, 0);
  };

  const selectedCount = getSelectedItems().length;

  const handleCheckout = () => {
    if (selectedCount === 0) {
      toast.error('Pilih minimal 1 produk untuk checkout');
      return;
    }

    localStorage.setItem('checkoutItems', JSON.stringify(getSelectedItems()));
    navigate('/customer/checkout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-pink-50/20 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Elegant Header */}
        <div className="mb-10">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Keranjang Belanja
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-16 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-full"></div>
              <p className="text-gray-600 font-medium">
                {cartItems.length === 0 ? 'Belum ada item' : `${cartItems.length} item di keranjang`}
              </p>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-[#cb5094]/20 to-[#e570b3]/20 rounded-full blur-3xl"></div>
              <div className="relative w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border border-[#cb5094]/10">
                <ShoppingBag className="w-20 h-20 text-[#cb5094]/30" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Keranjang Masih Kosong</h2>
            <p className="text-gray-500 mb-10 max-w-md text-center font-medium text-lg">
              Yuk mulai belanja sekarang dan temukan produk favorit kamu!
            </p>
            <button
              onClick={() => navigate('/customer/products')}
              className="group px-12 py-5 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-3 transform hover:scale-105"
            >
              Mulai Belanja
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Select All Bar */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#cb5094]/10 p-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-between w-full group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedItems.length === cartItems.length && cartItems.length > 0
                        ? 'bg-[#cb5094] border-[#cb5094]'
                        : 'border-gray-400 group-hover:border-[#cb5094]'
                    }`}>
                      {selectedItems.length === cartItems.length && cartItems.length > 0 && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      Pilih Semua
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    {selectedCount} / {cartItems.length}
                  </span>
                </button>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cartItems.map((item, index) => {
                  const displayImage = item.variantImageUrl || 
                                      (item.gambarUrl?.split('|||')[0]) || 
                                      'https://via.placeholder.com/200?text=No+Image';

                  const maxStock = item.stok ?? 999;
                  const isMaxReached = item.quantity >= maxStock;
                  const isSelected = selectedItems.includes(index);

                  return (
                    <div 
                      key={index}
                      className={`group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${
                        isSelected ? 'ring-2 ring-[#cb5094] shadow-[#cb5094]/20' : ''
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3]"></div>
                      )}

                      {/* Tombol Hapus di kanan atas */}
                      <button
                        onClick={() => confirmRemoveFromCart(index)}
                        className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" strokeWidth={2} />
                      </button>

                      <div className="p-4 pt-12">
                        <div className="flex gap-3">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-0.5">
                            <button onClick={() => toggleSelectItem(index)}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#cb5094] border-[#cb5094]'
                                  : 'border-gray-400 group-hover:border-[#cb5094]'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          </div>

                          {/* Image & Quantity */}
                          <div className="flex-shrink-0 flex flex-col gap-2">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                              <img 
                                src={displayImage} 
                                alt={item.nama} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                              {item.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full shadow-md">
                                  <span className="text-[9px] font-bold text-white">×{item.quantity}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-gray-50 to-pink-50/30 rounded-lg px-2 py-1.5">
                              <button 
                                onClick={() => updateQuantity(index, -1)} 
                                disabled={item.quantity <= 1}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                  item.quantity <= 1
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:shadow-md hover:scale-105'
                                }`}
                              >
                                <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
                              </button>
                              <span className="text-xs font-bold text-gray-900 w-5 text-center">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(index, 1)}
                                disabled={isMaxReached}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                  isMaxReached
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-[#cb5094] to-[#e570b3] text-white hover:shadow-lg hover:scale-105'
                                }`}
                              >
                                <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
                              {item.nama}
                            </h3>
                            
                            {(item.ukuran || item.warna) && (
                              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                {item.ukuran && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-[#cb5094] bg-gradient-to-r from-[#cb5094]/10 to-[#e570b3]/10 rounded-full border border-[#cb5094]/30">
                                    {item.ukuran}
                                  </span>
                                )}
                                {item.warna && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-[#cb5094] bg-gradient-to-r from-[#cb5094]/10 to-[#e570b3]/10 rounded-full border border-[#cb5094]/30">
                                    {item.warna}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <p className="text-[10px] text-gray-600 font-semibold">
                                Stok: {maxStock === 999 ? 'Tersedia' : `${maxStock} pcs`}
                              </p>
                            </div>

                            <p className="text-base font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent leading-tight">
                              {formatPrice(item.harga * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[9px] text-gray-500 font-semibold mt-1">
                                {formatPrice(item.harga)} × {item.quantity}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkout Summary dengan Gradasi Putih ke #cb5094 */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <div className="relative overflow-hidden rounded-2xl shadow-xl border border-white/20 bg-gradient-to-br from-white to-[#cb5094]/20 backdrop-blur-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#cb5094]/10 to-[#e570b3]/10 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 p-6 space-y-5 text-gray-800">
                    <div className="pb-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Ringkasan Pesanan</h2>
                      <p className="text-xs font-semibold">{selectedCount} item dipilih</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs uppercase tracking-wider font-bold">Subtotal</span>
                        <span className="text-base font-bold">
                          {formatPrice(getTotalPrice())}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-xs uppercase tracking-wider font-bold">Total Barang</span>
                        <span className="text-base font-bold">
                          {getTotalQuantity()} pcs
                        </span>
                      </div>

                      <div className="pt-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-bold uppercase tracking-wide">Total Bayar</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent block">
                              {formatPrice(getTotalPrice())}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-right opacity-80">*Ongkir dihitung di checkout</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-3">
                      <button
                        onClick={handleCheckout}
                        disabled={selectedCount === 0}
                        className={`w-full py-4 rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                          selectedCount === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white hover:shadow-2xl hover:shadow-[#cb5094]/40 transform hover:scale-105 active:scale-95'
                        }`}
                      >
                        Lanjut ke Checkout
                        <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                      </button>

                      <button
                        onClick={() => navigate('/customer/products')}
                        className="w-full py-3 rounded-xl text-sm font-bold text-[#cb5094] border-2 border-[#cb5094] hover:bg-[#cb5094] hover:text-white transition-all duration-300"
                      >
                        Lanjut Belanja
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popup Konfirmasi Hapus */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah anda yakin ingin menghapus produk ini dari keranjang?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-5 py-2.5 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={executeRemoveFromCart}
                className="px-5 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerCart;
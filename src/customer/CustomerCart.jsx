import { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, CheckSquare, Square } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerCart() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // index item yang dipilih
  const navigate = useNavigate();
  const { setCartCount } = useOutletContext();

  useLayoutEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, [setCartCount]);

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      // Select all by default
      setSelectedItems(cart.map((_, i) => i));
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
    setCartCount(cart.reduce((sum, i) => sum + i.quantity, 0));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Jumlah diperbarui');
  };

  const removeFromCart = (index) => {
    const cart = cartItems.filter((_, i) => i !== index);
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartItems(cart);
    setCartCount(cart.reduce((sum, i) => sum + i.quantity, 0));
    setSelectedItems(prev => prev.filter(i => i !== index));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Produk dihapus dari keranjang');
  };

  const getSelectedItems = () => {
    return cartItems.filter((_, index) => selectedItems.includes(index));
  };

  const getTotalPrice = () => {
    const selected = getSelectedItems();
    return selected.reduce((sum, item) => sum + item.harga * item.quantity, 0);
  };

  const selectedCount = getSelectedItems().length;

  const handleCheckout = () => {
    if (selectedCount === 0) {
      toast.error('Pilih minimal 1 produk untuk checkout');
      return;
    }

    // Simpan item terpilih untuk diproses di halaman checkout
    localStorage.setItem('checkoutItems', JSON.stringify(getSelectedItems()));

    // Arahkan ke halaman checkout (bukan langsung orders)
    navigate('/customer/checkout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 pb-24 lg:pb-0">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Keranjang Belanja</h1>
          <p className="text-sm text-gray-600">
            {cartItems.length === 0 
              ? 'Keranjang kosong' 
              : `${cartItems.length} jenis • ${selectedCount} dipilih`}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-800 mb-3">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-8">Yuk isi dengan produk favoritmu!</p>
            <button
              onClick={() => navigate('/customer/products')}
              className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-10 py-4 rounded-2xl font-bold hover:shadow-xl transition-all transform hover:scale-105"
            >
              Mulai Belanja
            </button>
          </div>
        ) : (
          <>
            {/* Pilih Semua */}
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="text-gray-700 hover:text-[#cb5094] transition"
              >
                {selectedItems.length === cartItems.length && cartItems.length > 0 ? (
                  <CheckSquare className="w-6 h-6" />
                ) : (
                  <Square className="w-6 h-6" />
                )}
              </button>
              <span className="text-sm font-medium text-gray-700">
                Pilih Semua ({selectedCount}/{cartItems.length})
              </span>
            </div>

            {/* Card Produk - Diperkecil & rapi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all ${
                      isSelected ? 'ring-2 ring-[#cb5094]' : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleSelectItem(index)}
                          className="mt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#cb5094]" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          <img src={displayImage} alt={item.nama} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.nama}</h3>
                          {item.ukuran && (
                            <p className="text-xs text-gray-600">Ukuran: {item.ukuran}</p>
                          )}
                          {item.warna && (
                            <p className="text-xs text-gray-600">Warna: {item.warna}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Stok: {maxStock === 999 ? 'Banyak' : maxStock}
                          </p>
                          <p className="font-bold text-[#cb5094] text-base mt-2">
                            {formatPrice(item.harga * item.quantity)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(index, -1)} 
                            disabled={item.quantity <= 1}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition text-sm ${
                              item.quantity <= 1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-base font-bold w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(index, 1)}
                            disabled={isMaxReached}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition text-sm ${
                              isMaxReached
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(index)} 
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout Summary - Tombol kecil & rapi */}
            <div className="bg-white rounded-2xl shadow-lg p-5 sticky bottom-20 lg:bottom-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Total ({selectedCount} item)</h2>
                  <p className="text-xs text-gray-600">Ongkir dihitung di checkout</p>
                </div>
                <p className="text-2xl font-bold text-[#cb5094]">{formatPrice(getTotalPrice())}</p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={selectedCount === 0}
                className={`w-full py-3 rounded-xl text-base font-bold transition-all ${
                  selectedCount === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white hover:shadow-xl hover:scale-105'
                }`}
              >
                Lanjut ke Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerCart;
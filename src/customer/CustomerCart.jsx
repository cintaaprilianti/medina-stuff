import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

function CustomerCart() {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const updateQuantity = (key, change) => {
    const updated = cartItems.map(item =>
      item.key === key
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    );
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeFromCart = (key) => {
    const updated = cartItems.filter(item => item.key !== key);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getTotalPrice = () => cartItems.reduce((sum, item) => sum + item.hargaDasar * item.quantity, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
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
            onClick={() => navigate('/customer/products')}
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
  );
}

export default CustomerCart;
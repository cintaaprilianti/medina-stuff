import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerCart() {
  const navigate = useNavigate();
  const { setCartCount } = useOutletContext();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  };

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    const totalCount = newCart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalCount);
  };

  const updateQuantity = (key, delta) => {
    const newCart = cart.map(item => {
      if (item.key === key) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(newCart);
    toast.success('Quantity updated');
  };

  const removeItem = (key) => {
    const newCart = cart.filter(item => item.key !== key);
    updateCart(newCart);
    toast.success('Item removed from cart');
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    navigate('/customer/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
          <p className="text-gray-600 mb-6">Belum ada produk di keranjang kamu</p>
          <button
            onClick={() => navigate('/customer/products')}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition"
          >
            Mulai Belanja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
          <p className="text-sm text-gray-600 mt-1">{cart.length} item(s) dalam keranjang</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, idx) => (
              <div key={item.key} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <div className="flex gap-4">
                  <img
                    src={item.gambarUtama || 'https://via.placeholder.com/100'}
                    alt={item.nama}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">{item.nama}</h3>
                    {item.variantName && (
                      <p className="text-sm text-gray-600 mb-2">{item.variantName}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-pink-600">
                        {formatPrice(item.harga)}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.key, -1)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                        >
                          <Minus className="w-4 h-4 text-gray-700" />
                        </button>
                        
                        <div className="w-12 text-center font-bold text-gray-900">
                          {item.quantity}
                        </div>
                        
                        <button
                          onClick={() => updateQuantity(item.key, 1)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                        >
                          <Plus className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Subtotal: <span className="font-bold text-gray-900">
                          {formatPrice(item.harga * item.quantity)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(item.key)}
                        className="text-red-500 hover:text-red-600 font-semibold text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Ringkasan Belanja</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cart.length} item)</span>
                  <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                </div>
                
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-pink-600 text-xl">
                    {formatPrice(calculateSubtotal())}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/customer/products')}
                className="w-full mt-3 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Lanjut Belanja
              </button>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                <Package className="w-4 h-4 inline mr-2" />
                Ongkos kirim akan dihitung di halaman checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerCart;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, Truck, Package, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [shippingForm, setShippingForm] = useState({
    namaPenerima: '',
    teleponPenerima: '',
    alamatBaris1: '',
    alamatBaris2: '',
    kota: '',
    provinsi: '',
    kodePos: ''
  });
  
  const [tipe, setTipe] = useState('READY'); 
  const [ongkosKirim, setOngkosKirim] = useState(15000);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    loadCart();
    loadShippingInfo();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (savedCart.length === 0) {
      toast.error('Keranjang kosong');
      navigate('/customer/products');
      return;
    }
    setCart(savedCart);
  };

  const loadShippingInfo = () => {
    const saved = localStorage.getItem('shippingInfo');
    if (saved) {
      setShippingForm(JSON.parse(saved));
    }
  };

  const saveShippingInfo = () => {
    localStorage.setItem('shippingInfo', JSON.stringify(shippingForm));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + ongkosKirim;
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
  
    if (!shippingForm.namaPenerima || !shippingForm.teleponPenerima || 
        !shippingForm.alamatBaris1 || !shippingForm.kota || 
        !shippingForm.provinsi || !shippingForm.kodePos) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    saveShippingInfo();
    setStep(3);
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);

      const orderData = {
        items: cart.map(item => ({
          productVariantId: item.variantId,
          kuantitas: item.quantity
        })),
        alamatPengiriman: shippingForm,
        tipe,
        ongkosKirim,
        catatan
      };

      const response = await api.post('/orders', orderData);
      const order = response.data.order;

      toast.success('Pesanan berhasil dibuat!');
  
      localStorage.removeItem('cart');
     
      navigate(`/customer/payment/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[
              { num: 1, label: 'Review Cart', icon: ShoppingCart },
              { num: 2, label: 'Shipping Info', icon: MapPin },
              { num: 3, label: 'Confirm Order', icon: CheckCircle }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step >= s.num 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white text-gray-400 border border-gray-200'
                }`}>
                  <s.icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-semibold">{s.label}</span>
                </div>
                {idx < 2 && (
                  <div className={`w-12 sm:w-24 h-0.5 ${step > s.num ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-pink-500" />
                  Review Your Cart
                </h2>

                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <img
                        src={
                          item.variantImageUrl || 
                          (item.gambarUrl?.split('|||')[0]) || 
                          'https://via.placeholder.com/100?text=No+Image'
                        }
                        alt={item.nama}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=No+Image'}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.nama}</h3>
                        {item.variantName && (
                          <p className="text-sm text-gray-600">{item.variantName}</p>
                        )}
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-pink-600">{formatPrice(item.harga)}</p>
                        <p className="text-sm text-gray-500">
                          Total: {formatPrice(item.harga * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition"
                >
                  Continue to Shipping
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-pink-500" />
                  Shipping Information
                </h2>

                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nama Penerima *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.namaPenerima}
                        onChange={(e) => setShippingForm({...shippingForm, namaPenerima: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.teleponPenerima}
                        onChange={(e) => setShippingForm({...shippingForm, teleponPenerima: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Alamat Lengkap *
                    </label>
                    <input
                      type="text"
                      value={shippingForm.alamatBaris1}
                      onChange={(e) => setShippingForm({...shippingForm, alamatBaris1: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                      placeholder="Jl. Nama Jalan No. 123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Detail Alamat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={shippingForm.alamatBaris2}
                      onChange={(e) => setShippingForm({...shippingForm, alamatBaris2: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                      placeholder="Patokan, RT/RW, dll"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Kota *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.kota}
                        onChange={(e) => setShippingForm({...shippingForm, kota: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Provinsi *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.provinsi}
                        onChange={(e) => setShippingForm({...shippingForm, provinsi: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Kode Pos *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.kodePos}
                        onChange={(e) => setShippingForm({...shippingForm, kodePos: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-pink-500" />
                    Shipping Address
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-900">{shippingForm.namaPenerima}</p>
                    <p className="text-sm text-gray-600">{shippingForm.teleponPenerima}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {shippingForm.alamatBaris1}
                      {shippingForm.alamatBaris2 && `, ${shippingForm.alamatBaris2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shippingForm.kota}, {shippingForm.provinsi} {shippingForm.kodePos}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="mt-3 text-sm text-pink-500 font-semibold hover:underline"
                  >
                    Edit Address
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-pink-500" />
                    Order Type
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTipe('READY')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tipe === 'READY'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Ready Stock</div>
                      <div className="text-xs text-gray-600">Kirim langsung</div>
                    </button>
                    <button
                      onClick={() => setTipe('PREORDER')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tipe === 'PREORDER'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Pre-Order</div>
                      <div className="text-xs text-gray-600">Proses 7-14 hari</div>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Order Notes (Optional)</h3>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                    rows="3"
                    placeholder="Tambahkan catatan untuk pesanan..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Create Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cart.length} items)</span>
                  <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping Fee</span>
                  <span className="font-semibold">{formatPrice(ongkosKirim)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-pink-600 text-xl">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Free shipping untuk pembelian di atas Rp 100.000
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerCheckout;
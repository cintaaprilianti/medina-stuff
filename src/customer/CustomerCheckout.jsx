import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, CheckCircle, ArrowLeft, ChevronDown, ChevronUp, Package } from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showItemDetails, setShowItemDetails] = useState(false);

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
  const [ongkosKirim, setOngkosKirim] = useState(0);
  const [loadingOngkir, setLoadingOngkir] = useState(false);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    loadCart();
    loadShippingInfo();
  }, []);

  useEffect(() => {
    if (step === 3 && shippingForm.kota && shippingForm.provinsi) {
      fetchOngkir();
    }
  }, [step, shippingForm.kota, shippingForm.provinsi]);

  const loadCart = () => {
    const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    
    if (checkoutItems.length === 0) {
      toast.error('Tidak ada item yang dipilih untuk checkout');
      navigate('/customer/cart');
      return;
    }
    
    setCart(checkoutItems);
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

  const fetchOngkir = async () => {
    try {
      setLoadingOngkir(true);
      
      const totalBerat = cart.reduce((sum, item) => {
        const beratItem = item.berat || 500;
        return sum + (beratItem * item.quantity);
      }, 0);

      // Jika endpoint shipping belum ada, gunakan logika sederhana
      // Bisa diganti dengan API call nanti: const response = await api.post('/shipping/calculate', {...});
      
      // Logika ongkir sederhana berdasarkan berat
      let calculatedOngkir = 0;
      if (totalBerat <= 1000) {
        calculatedOngkir = 15000;
      } else if (totalBerat <= 3000) {
        calculatedOngkir = 25000;
      } else {
        calculatedOngkir = 35000;
      }

      // Gratis ongkir jika subtotal > 100000
      if (calculateSubtotal() > 100000) {
        calculatedOngkir = 0;
      }

      setOngkosKirim(calculatedOngkir);
      
    } catch (error) {
      console.error('Error fetching ongkir:', error);
      setOngkosKirim(15000);
    } finally {
      setLoadingOngkir(false);
    }
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

    // Validasi format nomor telepon (harus dimulai dengan 08 dan 10-13 digit)
    const phoneRegex = /^08\d{8,11}$/;
    if (!phoneRegex.test(shippingForm.teleponPenerima)) {
      toast.error('Nomor telepon tidak valid. Contoh: 081234567890');
      return;
    }

    // Validasi kode pos (harus 5 digit)
    const postalRegex = /^\d{5}$/;
    if (!postalRegex.test(shippingForm.kodePos)) {
      toast.error('Kode pos harus 5 digit angka');
      return;
    }

    saveShippingInfo();
    setStep(3);
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);

      const items = cart.map(item => ({
        productVariantId: item.variantId || item.id,
        kuantitas: Number(item.quantity)
      }));

      // Format alamat sesuai dengan yang diharapkan backend (camelCase Indonesia)
      const alamatPengiriman = {
        namaPenerima: shippingForm.namaPenerima,
        teleponPenerima: shippingForm.teleponPenerima,
        alamatBaris1: shippingForm.alamatBaris1,
        alamatBaris2: shippingForm.alamatBaris2 || '',
        kota: shippingForm.kota,
        provinsi: shippingForm.provinsi,
        kodePos: shippingForm.kodePos
      };

      const orderData = {
        items,
        alamatPengiriman,
        tipe,
        ongkosKirim: Number(ongkosKirim),
        catatan: catatan || ''
      };

      console.log('Order data yang dikirim:', orderData);

      const response = await api.post('/orders', orderData);
      const order = response.data.order;

      toast.success('Pesanan berhasil dibuat!');

      const fullCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const remainingCart = fullCart.filter(cartItem => {
        return !cart.some(checkoutItem => 
          cartItem.id === checkoutItem.id && 
          (cartItem.variantId || cartItem.id) === (checkoutItem.variantId || checkoutItem.id) &&
          (cartItem.ukuran || '') === (checkoutItem.ukuran || '') &&
          (cartItem.warna || '') === (checkoutItem.warna || '')
        );
      });
      
      localStorage.setItem('cart', JSON.stringify(remainingCart));
      localStorage.removeItem('checkoutItems');
      window.dispatchEvent(new Event('cartUpdated'));
     
      navigate(`/customer/payment/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          toast.error(error.response.data.message.join(', '));
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error('Gagal membuat pesanan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-pink-50/20 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/customer/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#cb5094] mb-4 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Keranjang
          </button>
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Checkout
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-16 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-full"></div>
            <p className="text-gray-600 font-medium">
              {cart.length} item siap untuk checkout
            </p>
          </div>
        </div>

        {/* Progress Steps */}
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
                    ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg' 
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }`}>
                  <s.icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-bold">{s.label}</span>
                </div>
                {idx < 2 && (
                  <div className={`w-12 sm:w-24 h-1 ${step > s.num ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3]' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Review Cart */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-[#cb5094]" />
                  Review Item Anda
                </h2>

                <div className="space-y-3">
                  {cart.map((item, idx) => {
                    const displayImage = item.variantImageUrl || 
                                        (item.gambarUrl?.split('|||')[0]) || 
                                        'https://via.placeholder.com/100?text=No+Image';
                    
                    return (
                      <div key={idx} className="flex gap-4 p-4 bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl border border-[#cb5094]/10 hover:shadow-md transition-shadow">
                        <div className="relative">
                          <img
                            src={displayImage}
                            alt={item.nama}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=No+Image'}
                          />
                          {item.quantity > 1 && (
                            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full shadow-md">
                              <span className="text-xs font-bold text-white">×{item.quantity}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{item.nama}</h3>
                          {(item.ukuran || item.warna) && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {item.ukuran && (
                                <span className="px-2 py-0.5 text-xs font-bold text-[#cb5094] bg-[#cb5094]/10 rounded-full border border-[#cb5094]/30">
                                  {item.ukuran}
                                </span>
                              )}
                              {item.warna && (
                                <span className="px-2 py-0.5 text-xs font-bold text-[#cb5094] bg-[#cb5094]/10 rounded-full border border-[#cb5094]/30">
                                  {item.warna}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                            {formatPrice(item.harga * item.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-[#cb5094]/40 transition-all duration-300 transform hover:scale-105"
                >
                  Lanjut ke Pengiriman
                </button>
              </div>
            )}

            {/* Step 2: Shipping Info */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#cb5094]" />
                  Informasi Pengiriman
                </h2>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nama Penerima *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.namaPenerima}
                        onChange={(e) => setShippingForm({...shippingForm, namaPenerima: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.teleponPenerima}
                        onChange={(e) => {
                          // Hanya izinkan angka
                          const value = e.target.value.replace(/\D/g, '');
                          setShippingForm({...shippingForm, teleponPenerima: value});
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        placeholder="081234567890"
                        maxLength="13"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 08xxxxxxxxxx</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Alamat Lengkap *
                    </label>
                    <input
                      type="text"
                      value={shippingForm.alamatBaris1}
                      onChange={(e) => setShippingForm({...shippingForm, alamatBaris1: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                      placeholder="Jl. Nama Jalan No. 123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Detail Alamat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={shippingForm.alamatBaris2}
                      onChange={(e) => setShippingForm({...shippingForm, alamatBaris2: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                      placeholder="Patokan, RT/RW, dll"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Kota *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.kota}
                        onChange={(e) => setShippingForm({...shippingForm, kota: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Provinsi *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.provinsi}
                        onChange={(e) => setShippingForm({...shippingForm, provinsi: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Kode Pos *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.kodePos}
                        onChange={(e) => {
                          // Hanya izinkan angka dan maksimal 5 digit
                          const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                          setShippingForm({...shippingForm, kodePos: value});
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        placeholder="12345"
                        maxLength="5"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">5 digit angka</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleShippingSubmit}
                      className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-[#cb5094]/40 transition-all duration-300 transform hover:scale-105"
                    >
                      Lanjutkan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirm Order */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-[#cb5094]" />
                    Alamat Pengiriman
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl p-4 border border-[#cb5094]/10">
                    <p className="font-bold text-gray-900">{shippingForm.namaPenerima}</p>
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
                    className="mt-3 text-sm text-[#cb5094] font-bold hover:underline"
                  >
                    Edit Alamat
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Catatan Pesanan (Opsional)</h3>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                    rows="3"
                    placeholder="Tambahkan catatan untuk pesanan..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    disabled={loading}
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-[#cb5094]/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Memproses...' : 'Buat Pesanan'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ringkasan Pesanan */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="relative overflow-hidden rounded-2xl shadow-xl border border-white/20 bg-gradient-to-br from-white to-[#cb5094]/20 backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#cb5094]/10 to-[#e570b3]/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 p-6 space-y-5">
                  <div className="pb-4 border-b border-gray-300">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Ringkasan Pesanan</h3>
                    <p className="text-xs font-semibold text-gray-600">
                      {cart.length} item · {totalQuantity} pcs
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <button
                      onClick={() => setShowItemDetails(!showItemDetails)}
                      className="w-full flex items-center justify-between text-sm font-bold text-gray-900 hover:text-[#cb5094] transition-colors"
                    >
                      <span>Detail Barang ({cart.length})</span>
                      {showItemDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showItemDetails && (
                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                            <img
                              src={item.variantImageUrl || (item.gambarUrl?.split('|||')[0]) || 'https://via.placeholder.com/40'}
                              alt={item.nama}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{item.nama}</p>
                              {(item.ukuran || item.warna) && (
                                <p className="text-[10px] text-gray-600">
                                  {item.ukuran && `${item.ukuran}`}
                                  {item.ukuran && item.warna && ' · '}
                                  {item.warna && `${item.warna}`}
                                </p>
                              )}
                              <p className="text-xs text-gray-600">
                                {item.quantity}× {formatPrice(item.harga)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-900">
                                {formatPrice(item.harga * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-gray-700">Subtotal</span>
                      <span className="text-base font-bold text-gray-900">
                        {formatPrice(calculateSubtotal())}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-300">
                      <span className="text-xs uppercase tracking-wider font-bold text-gray-700">Ongkir</span>
                      <div className="text-right">
                        {loadingOngkir ? (
                          <span className="text-sm text-gray-500 animate-pulse">Menghitung...</span>
                        ) : ongkosKirim === 0 ? (
                          <span className="text-base font-bold text-green-600">GRATIS</span>
                        ) : (
                          <span className="text-base font-bold text-gray-900">
                            {formatPrice(ongkosKirim)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold uppercase tracking-wide text-gray-900">Total Bayar</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent block">
                            {formatPrice(calculateTotal())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {step === 3 && ongkosKirim === 0 && !loadingOngkir && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 text-xs font-bold text-green-800">
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Selamat! Anda mendapat gratis ongkir
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerCheckout;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, Truck, ShoppingBag, AlertCircle, 
  CreditCard, Package, User, Phone, MapPin 
} from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Placeholder SVG untuk no image
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial, sans-serif%22 font-size=%2210%22 fill=%22%23d1d5db%22%3ENo Image%3C/text%3E%3C/svg%3E';

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/orders');
      const ordersData = response.data.orders || [];

      const transformedOrders = ordersData.map(order => {
        const orderItems = Array.isArray(order.items) ? order.items : [];

        const items = orderItems.map((item, idx) => {
          // FIX NAMA PRODUK: coba beberapa kemungkinan field
          let nama = 'Produk Tidak Diketahui';
          if (item.namaProduk) nama = item.namaProduk;
          else if (item.product?.nama) nama = item.product.nama;
          else if (item.variant?.nama) nama = item.variant.nama;
          else if (item.nama) nama = item.nama;

          // FIX GAMBAR: coba semua kemungkinan field
          let imageUrl = placeholderImage;
          if (item.gambarVariant && typeof item.gambarVariant === 'string' && item.gambarVariant.trim()) {
            imageUrl = item.gambarVariant.trim();
          } else if (item.gambarUrl && typeof item.gambarUrl === 'string' && item.gambarUrl.trim()) {
            const urls = item.gambarUrl.split('|||').filter(Boolean);
            if (urls.length > 0) imageUrl = urls[0].trim();
          } else if (item.variant?.gambar && typeof item.variant.gambar === 'string' && item.variant.gambar.trim()) {
            imageUrl = item.variant.gambar.trim();
          } else if (item.product?.gambarUtama && typeof item.product.gambarUtama === 'string' && item.product.gambarUtama.trim()) {
            imageUrl = item.product.gambarUtama.trim();
          } else if (item.product?.gambarUrl && typeof item.product.gambarUrl === 'string' && item.product.gambarUrl.trim()) {
            const urls = item.product.gambarUrl.split('|||').filter(Boolean);
            if (urls.length > 0) imageUrl = urls[0].trim();
          }

          return {
            id: item.id || `item-${idx}`,
            nama: nama,
            ukuran: item.ukuranVariant || item.ukuran || '-',
            warna: item.warnaVariant || item.warna || '-',
            quantity: item.kuantitas || item.quantity || 1,
            harga: parseFloat(item.hargaSnapshot || item.harga || 0),
            subtotal: parseFloat(item.subtotal || 0),
            gambarUrl: imageUrl
          };
        });

        // Format alamat
        const alamatBaris2 = order.alamatBaris2 ? `, ${order.alamatBaris2}` : '';
        const alamat = `${order.alamatBaris1 || ''}${alamatBaris2}, ${order.kota || ''}, ${order.provinsi || ''} ${order.kodePos || ''}`;
        const alamatClean = alamat.replace(/^,\s*|\s*,\s*$/g, '').trim() || 'Alamat tidak tersedia';

        return {
          id: order.nomorOrder || 'Unknown',
          orderId: order.id,
          tanggal: order.dibuatPada,
          status: mapBackendStatusToFrontend(order.status),
          total: parseFloat(order.total) || 0,
          subtotal: parseFloat(order.subtotal) || 0,
          ongkosKirim: parseFloat(order.ongkosKirim) || 0,
          namaPenerima: order.namaPenerima || '-',
          teleponPenerima: order.teleponPenerima || '-',
          alamat: alamatClean,
          items
        };
      });

      setOrders(transformedOrders);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.response?.data?.message || 'Gagal memuat pesanan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const mapBackendStatusToFrontend = (backendStatus) => {
    const map = {
      'PENDING_PAYMENT': 'pending',
      'PAID': 'confirmed',
      'PROCESSING': 'confirmed',
      'SHIPPED': 'shipping',
      'COMPLETED': 'delivered',
      'CANCELLED': 'cancelled'
    };
    return map[backendStatus] || 'pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'Menunggu Pembayaran', icon: Clock, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.08)' },
      confirmed: { label: 'Diproses', icon: Package, color: '#cb5094', bg: 'rgba(203, 80, 148, 0.08)' },
      shipping: { label: 'Dikirim', icon: Truck, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
      delivered: { label: 'Selesai', icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
      cancelled: { label: 'Dibatalkan', icon: XCircle, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)' }
    };
    return configs[status] || configs.pending;
  };

  const handlePayment = (order) => {
    if (order?.orderId) {
      navigate(`/customer/payment/${order.orderId}`);
    }
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const filterOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'pending', label: 'Bayar' },
    { value: 'confirmed', label: 'Proses' },
    { value: 'shipping', label: 'Kirim' },
    { value: 'delivered', label: 'Selesai' },
    { value: 'cancelled', label: 'Batal' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-1 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-[#cb5094] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 px-1 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="bg-white rounded-lg p-6 text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-4">{error}</p>
          <button 
            onClick={loadOrders} 
            className="bg-[#cb5094] text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-[#b54684] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-pink-50 via-white to-purple-50 border-b border-pink-100/50">
        <div className="px-3 md:px-6 pt-3 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingBag className="w-6 h-6 text-[#cb5094]" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
              <p className="text-xs text-gray-500 mt-0.5">{orders.length} total pesanan</p>
            </div>
          </div>
          
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
            {filterOptions.map(f => {
              const count = f.value === 'all' ? orders.length : orders.filter(o => o.status === f.value).length;
              const active = filterStatus === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active 
                      ? 'bg-[#cb5094] text-white shadow-md shadow-pink-200/50' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    active ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-3 md:px-6 pb-20">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Belum ada pesanan</p>
            <button 
              onClick={() => navigate('/customer/products')} 
              className="bg-[#cb5094] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b54684] transition-colors"
            >
              Mulai Belanja
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {filteredOrders.map(order => {
              const cfg = getStatusConfig(order.status);
              const Icon = cfg.icon;

              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {/* MOBILE LAYOUT */}
                  <div className="md:hidden">
                    {/* Header */}
                    <div className="px-3 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{order.id}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.tanggal)}</p>
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: cfg.bg,
                            color: cfg.color 
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      
                      {/* Info Pengguna */}
                      <div className="flex items-start gap-2 mb-2">
                        <User className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{order.namaPenerima}</p>
                          <p className="text-xs text-gray-600">{order.teleponPenerima}</p>
                        </div>
                      </div>
                      
                      {/* Info Alamat */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed flex-1">{order.alamat}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-3 py-3">
                      {order.items.map((item, idx) => (
                        <div key={item.id} className={`flex gap-3 ${idx > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}`}>
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                            <img
                              src={item.gambarUrl}
                              alt={item.nama}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = placeholderImage; }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">{item.nama}</h4>
                            <div className="flex items-center justify-between">
                              <div>
                                {(item.ukuran !== '-' || item.warna !== '-') && (
                                  <p className="text-xs text-gray-500">
                                    {item.ukuran !== '-' && item.warna !== '-' ? `${item.ukuran} • ${item.warna}` : item.ukuran !== '-' ? item.ukuran : item.warna}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5">{formatPrice(item.harga)} × {item.quantity}</p>
                              </div>
                              <span className="font-bold text-sm text-gray-900">{formatPrice(item.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Total Barang: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        <span className="text-lg font-bold text-[#cb5094]">{formatPrice(order.total)}</span>
                      </div>
                      
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handlePayment(order)} 
                          className="w-full bg-[#cb5094] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#b54684] transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          Bayar Sekarang
                        </button>
                      )}
                      {order.status === 'shipping' && (
                        <button className="w-full border-2 border-[#cb5094] text-[#cb5094] py-2 rounded-lg text-sm font-semibold hover:bg-[#cb5094] hover:text-white transition-colors flex items-center justify-center gap-2">
                          <Truck className="w-4 h-4" />
                          Lacak Pesanan
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <div className="w-full text-center py-2 text-sm text-gray-500 font-medium">
                          Pesanan sedang dikemas
                        </div>
                      )}
                      {order.status === 'delivered' && (
                        <div className="w-full text-center py-2 text-sm text-green-600 font-semibold">
                          ✓ Pesanan Selesai
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="w-full text-center py-2 text-sm text-gray-400 font-medium">
                          Pesanan Dibatalkan
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DESKTOP LAYOUT */}
                  <div className="hidden md:block">
                    {/* Header VERTIKAL */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      {/* Baris 1: Order ID + Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{order.id}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.tanggal)}</p>
                        </div>
                        <div 
                          className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                          style={{ 
                            backgroundColor: cfg.bg,
                            color: cfg.color 
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </div>
                      </div>
                      
                      {/* Baris 2: Info Pengguna - VERTIKAL */}
                      <div className="flex items-start gap-2 mb-2">
                        <User className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{order.namaPenerima}</p>
                          <p className="text-xs text-gray-600">{order.teleponPenerima}</p>
                        </div>
                      </div>

                      {/* Baris 3: Info Alamat - VERTIKAL DI BAWAH USER */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed">{order.alamat}</p>
                      </div>
                    </div>

                    {/* Items - 1 produk 1 baris horizontal */}
                    {order.items.map((item, idx) => (
                      <div key={item.id} className={`px-4 py-3 flex items-center gap-4 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          <img
                            src={item.gambarUrl}
                            alt={item.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = placeholderImage; }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">{item.nama}</h4>
                          {(item.ukuran !== '-' || item.warna !== '-') && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.ukuran !== '-' && item.warna !== '-' ? `${item.ukuran} • ${item.warna}` : item.ukuran !== '-' ? item.ukuran : item.warna}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatPrice(item.harga)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">× {item.quantity}</p>
                        </div>

                        <div className="text-right min-w-[120px]">
                          <p className="text-sm font-bold text-gray-900">{formatPrice(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}

                    {/* Footer - horizontal */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-gray-600">Total Barang: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Total Pembayaran:</span>
                          <span className="text-xl font-bold text-[#cb5094]">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                      
                      <div>
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => handlePayment(order)} 
                            className="bg-[#cb5094] text-white py-2 px-6 rounded-lg text-sm font-semibold hover:bg-[#b54684] transition-colors flex items-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Bayar Sekarang
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <button className="border-2 border-[#cb5094] text-[#cb5094] py-2 px-6 rounded-lg text-sm font-semibold hover:bg-[#cb5094] hover:text-white transition-colors flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Lacak Pesanan
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <div className="text-center py-2 px-6 text-sm text-gray-500 font-medium">
                            Pesanan sedang dikemas
                          </div>
                        )}
                        {order.status === 'delivered' && (
                          <div className="text-center py-2 px-6 text-sm text-green-600 font-semibold">
                            ✓ Pesanan Selesai
                          </div>
                        )}
                        {order.status === 'cancelled' && (
                          <div className="text-center py-2 px-6 text-sm text-gray-400 font-medium">
                            Pesanan Dibatalkan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerOrders;
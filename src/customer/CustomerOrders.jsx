import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, ShoppingBag, AlertCircle, CreditCard } from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/orders');
      const ordersData = response.data.orders || [];

      const transformedOrders = ordersData.map(order => ({
        id: order.nomorOrder,
        orderId: order.id,
        tanggal: order.dibuatPada,
        status: mapBackendStatusToFrontend(order.status),
        backendStatus: order.status,
        total: parseFloat(order.total),
        subtotal: parseFloat(order.subtotal),
        ongkosKirim: parseFloat(order.ongkosKirim),
        catatan: order.catatan,
        tipe: order.tipe,
        namaPenerima: order.namaPenerima,
        teleponPenerima: order.teleponPenerima,
        alamat: `${order.alamatBaris1}${order.alamatBaris2 ? ', ' + order.alamatBaris2 : ''}, ${order.kota}, ${order.provinsi} ${order.kodePos}`,
        items: order.items.map(item => ({
          id: item.id,
          nama: item.namaProduk,
          sku: item.skuVariant,
          ukuran: item.ukuranVariant,
          warna: item.warnaVariant,
          quantity: item.kuantitas,
          harga: parseFloat(item.hargaSnapshot),
          subtotal: parseFloat(item.subtotal),
          gambarUrl: 
            item.variant?.gambar || 
            item.product?.gambarUtama || 
            (item.product?.gambarUrl ? item.product.gambarUrl.split('|||')[0] : null) || 
            'https://via.placeholder.com/100?text=No+Image'
        }))
      }));

      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.response?.data?.message || 'Gagal memuat pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const mapBackendStatusToFrontend = (backendStatus) => {
    const statusMap = {
      'PENDING_PAYMENT': 'pending',
      'PAID': 'confirmed',
      'PROCESSING': 'confirmed',
      'SHIPPED': 'shipping',
      'COMPLETED': 'delivered',
      'CANCELLED': 'cancelled'
    };
    return statusMap[backendStatus] || 'pending';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Menunggu Pembayaran',
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        iconColor: 'text-yellow-600'
      },
      confirmed: {
        label: 'Dikonfirmasi',
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        iconColor: 'text-blue-600'
      },
      shipping: {
        label: 'Sedang Dikirim',
        icon: Truck,
        color: 'bg-purple-100 text-purple-700 border-purple-300',
        iconColor: 'text-purple-600'
      },
      delivered: {
        label: 'Selesai',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700 border-green-300',
        iconColor: 'text-green-600'
      },
      cancelled: {
        label: 'Dibatalkan',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-300',
        iconColor: 'text-red-600'
      }
    };
    return configs[status] || configs.pending;
  };

  const handlePayment = (order) => {
    navigate(`/customer/payment/${order.orderId}`);
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center bg-red-50 rounded-2xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Pesanan</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pesanan Saya</h1>
        <p className="text-sm text-gray-600 mt-1">Pantau status pesanan kamu di sini</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'pending', label: 'Menunggu Bayar' },
            { value: 'confirmed', label: 'Dikonfirmasi' },
            { value: 'shipping', label: 'Dikirim' },
            { value: 'delivered', label: 'Selesai' },
            { value: 'cancelled', label: 'Dibatalkan' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                filterStatus === filter.value
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              {filter.value !== 'all' && (
                <span className="ml-2 text-xs">
                  ({orders.filter(o => o.status === filter.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Pesanan</h2>
          <p className="text-sm text-gray-600 mb-6">
            {filterStatus === 'all' 
              ? 'Mulai belanja dan buat pesanan pertamamu!' 
              : `Tidak ada pesanan dengan status "${getStatusConfig(filterStatus).label}"`
            }
          </p>
          <button
            onClick={() => navigate('/customer/products')}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-lg">{order.id}</p>
                      <p className="text-white/90 text-sm">{formatDate(order.tanggal)}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${statusConfig.color} backdrop-blur-sm`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                      <span className="font-bold text-sm">{statusConfig.label}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
                        <img
                          src={item.gambarUrl}
                          alt={item.nama}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.nama}</h3>
                          <p className="text-xs text-gray-600">
                            {item.ukuran} • {item.warna} • {item.quantity}x
                          </p>
                          <p className="text-sm font-bold text-pink-600 mt-1">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Pembayaran</p>
                      <p className="text-2xl font-bold text-pink-600">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-500">
                        (Subtotal: {formatPrice(order.subtotal)} + Ongkir: {formatPrice(order.ongkosKirim)})
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {/* Tombol Detail DIHAPUS */}

                      {order.status === 'pending' && (
                        <button
                          onClick={() => handlePayment(order)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all text-sm"
                        >
                          <CreditCard className="w-5 h-5" />
                          <span>Bayar Sekarang</span>
                        </button>
                      )}

                      {(order.status === 'shipping' || order.status === 'delivered') && (
                        <button
                          onClick={() => toast.info('Fitur tracking sedang dikembangkan')}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-purple-500 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all text-sm"
                        >
                          <Truck className="w-5 h-5" />
                          Track
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <button
                          onClick={() => navigate('/customer/products')}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-pink-500 text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-all text-sm"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          <span>Beli Lagi</span>
                        </button>
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
  );
}

export default CustomerOrders;
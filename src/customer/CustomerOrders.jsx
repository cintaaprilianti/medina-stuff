import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye, ShoppingBag } from 'lucide-react';

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    // Simulasi data pesanan dari localStorage atau API
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Jika tidak ada data, buat sample data
    if (savedOrders.length === 0) {
      const sampleOrders = [
        {
          id: 'ORD-001',
          tanggal: '2024-12-01',
          status: 'delivered',
          total: 350000,
          items: [
            { nama: 'Gamis Syari Premium', quantity: 1, harga: 250000, gambarUrl: 'https://via.placeholder.com/100' },
            { nama: 'Hijab Segi Empat', quantity: 2, harga: 50000, gambarUrl: 'https://via.placeholder.com/100' }
          ]
        },
        {
          id: 'ORD-002',
          tanggal: '2024-12-05',
          status: 'shipping',
          total: 450000,
          items: [
            { nama: 'Tunik Casual Elegant', quantity: 1, harga: 300000, gambarUrl: 'https://via.placeholder.com/100' },
            { nama: 'Celana Kulot Premium', quantity: 1, harga: 150000, gambarUrl: 'https://via.placeholder.com/100' }
          ]
        },
        {
          id: 'ORD-003',
          tanggal: '2024-12-10',
          status: 'pending',
          total: 200000,
          items: [
            { nama: 'Outer Cardigan Modern', quantity: 1, harga: 200000, gambarUrl: 'https://via.placeholder.com/100' }
          ]
        },
        {
          id: 'ORD-004',
          tanggal: '2024-12-15',
          status: 'cancelled',
          total: 180000,
          items: [
            { nama: 'Dress Muslim Casual', quantity: 1, harga: 180000, gambarUrl: 'https://via.placeholder.com/100' }
          ]
        }
      ];
      
      localStorage.setItem('orders', JSON.stringify(sampleOrders));
      setOrders(sampleOrders);
    } else {
      setOrders(savedOrders);
    }
    
    setIsLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Menunggu Konfirmasi',
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

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#cb5094]/30 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pesanan Saya</h1>
        <p className="text-sm text-gray-600 mt-1">Pantau status pesanan kamu di sini</p>
      </div>

      {/* Filter Status */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'pending', label: 'Menunggu' },
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
                  ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg'
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

      {/* Order List */}
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
            className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition"
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
                {/* Header */}
                <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] p-4">
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

                {/* Items */}
                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
                        <img
                          src={item.gambarUrl || 'https://via.placeholder.com/100'}
                          alt={item.nama}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.nama}</h3>
                          <p className="text-xs text-gray-600">Jumlah: {item.quantity}x</p>
                          <p className="text-sm font-bold text-[#cb5094] mt-1">
                            {formatPrice(item.harga * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total & Actions */}
                  <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Pembayaran</p>
                      <p className="text-2xl font-bold text-[#cb5094]">{formatPrice(order.total)}</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => alert(`Detail pesanan ${order.id} akan ditampilkan`)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </button>

                      {order.status === 'delivered' && (
                        <button
                          onClick={() => navigate('/customer/products')}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#cb5094] text-[#cb5094] rounded-xl font-bold hover:bg-pink-50 transition-all"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Beli Lagi</span>
                        </button>
                      )}

                      {order.status === 'pending' && (
                        <button
                          onClick={() => {
                            if (confirm('Apakah kamu yakin ingin membatalkan pesanan ini?')) {
                              const updated = orders.map(o => 
                                o.id === order.id ? { ...o, status: 'cancelled' } : o
                              );
                              setOrders(updated);
                              localStorage.setItem('orders', JSON.stringify(updated));
                              alert('Pesanan berhasil dibatalkan');
                            }
                          }}
                          className="flex-1 sm:flex-none px-6 py-3 border-2 border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all"
                        >
                          Batalkan
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

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Pesanan', value: orders.length, color: 'from-blue-500 to-blue-600' },
            { label: 'Sedang Diproses', value: orders.filter(o => ['pending', 'confirmed', 'shipping'].includes(o.status)).length, color: 'from-yellow-500 to-orange-500' },
            { label: 'Selesai', value: orders.filter(o => o.status === 'delivered').length, color: 'from-green-500 to-green-600' },
            { label: 'Dibatalkan', value: orders.filter(o => o.status === 'cancelled').length, color: 'from-red-500 to-red-600' }
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-2xl shadow-lg p-4 text-white`}>
              <p className="text-sm opacity-90 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerOrders;
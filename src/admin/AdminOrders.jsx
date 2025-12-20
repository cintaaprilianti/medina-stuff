import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, Eye, MapPin, User, X } from 'lucide-react';
import api from '../utils/api';  // PAKAI YANG SAMA DENGAN CUSTOMER
import { formatPrice } from '../utils/formatPrice';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // GUNAKAN ENDPOINT YANG SAMA DENGAN CUSTOMER SUPAYA GAMBAR MUNCUL
      const response = await api.get('/orders');
      const ordersData = response.data.orders || [];
      
      const sortedOrders = ordersData.sort((a, b) => new Date(b.dibuatPada) - new Date(a.dibuatPada));
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Gagal memuat pesanan:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapStatusToFrontend = (status) => {
    const map = {
      PENDING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      PAID: { label: 'Dibayar', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      PROCESSING: { label: 'Diproses', color: 'bg-purple-100 text-purple-700', icon: Package },
      SHIPPED: { label: 'Dikirim', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
      COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return map[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: Package };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus.toUpperCase().replace(' ', '_'));

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-[#cb5094]/30 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Memuat Pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 lg:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Manajemen Pesanan</h1>
          <p className="text-gray-600">Kelola semua pesanan pelanggan</p>
        </div>

        {/* Filter Status */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'all', label: 'Semua Pesanan' },
              { value: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' },
              { value: 'PAID', label: 'Dibayar' },
              { value: 'PROCESSING', label: 'Diproses' },
              { value: 'SHIPPED', label: 'Dikirim' },
              { value: 'COMPLETED', label: 'Selesai' },
              { value: 'CANCELLED', label: 'Dibatalkan' },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                  filterStatus === filter.value
                    ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
                {filter.value !== 'all' && (
                  <span className="ml-2 text-xs opacity-80">
                    ({orders.filter(o => o.status === filter.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Pesanan */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Pesanan</h2>
            <p className="text-gray-600">Belum ada pesanan dengan status ini</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => {
              const statusConfig = mapStatusToFrontend(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={order.id} className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all">
                  <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-4 text-white">
                          <h3 className="text-xl font-bold">{order.nomorOrder}</h3>
                          <span className="text-sm opacity-90">{formatDate(order.dibuatPada)}</span>
                        </div>
                        <p className="text-white/90 mt-1">
                          {order.items.length} item • Total: <span className="font-bold">{formatPrice(order.total)}</span>
                        </p>
                      </div>
                      <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl ${statusConfig.color} shadow-lg`}>
                        <StatusIcon className="w-5 h-5" />
                        <span className="font-bold">{statusConfig.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5 text-[#cb5094]" />
                          Informasi Pelanggan
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Nama:</span> {order.namaPenerima}</p>
                          <p><span className="font-medium">Telepon:</span> {order.teleponPenerima}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-[#cb5094]" />
                          Alamat Pengiriman
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.alamatBaris1}
                          {order.alamatBaris2 && `, ${order.alamatBaris2}`}<br/>
                          {order.kota}, {order.provinsi} {order.kodePos}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-6 flex justify-end">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                      >
                        <Eye className="w-5 h-5" />
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Detail Pesanan */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-6 flex justify-between items-center rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-bold">Detail Pesanan #{selectedOrder.nomorOrder}</h2>
                <p className="text-white/90 mt-1">{formatDate(selectedOrder.dibuatPada)}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Status & Total */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Status Pesanan</h3>
                  <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${mapStatusToFrontend(selectedOrder.status).color} shadow-lg`}>
                    {(() => {
                      const StatusIcon = mapStatusToFrontend(selectedOrder.status).icon;
                      return <StatusIcon className="w-6 h-6" />;
                    })()}
                    <span className="text-lg font-bold">{mapStatusToFrontend(selectedOrder.status).label}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#fef5fb] to-white rounded-2xl p-6 border-2 border-[#cb5094]/20">
                  <h3 className="font-bold text-gray-900 mb-4">Ringkasan Pembayaran</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span>Subtotal</span>
                      <span className="font-bold">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>Ongkir</span>
                      <span className="font-bold">{formatPrice(selectedOrder.ongkosKirim)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-2xl">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-[#cb5094]">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Pelanggan & Alamat */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#cb5094]" />
                    Informasi Pelanggan
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nama:</span> {selectedOrder.namaPenerima}</p>
                    <p><span className="font-medium">Telepon:</span> {selectedOrder.teleponPenerima}</p>
                    {selectedOrder.catatan && (
                      <p><span className="font-medium">Catatan:</span> {selectedOrder.catatan}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#cb5094]" />
                    Alamat Pengiriman
                  </h3>
                  <p className="text-gray-700">
                    {selectedOrder.alamatBaris1}
                    {selectedOrder.alamatBaris2 && `, ${selectedOrder.alamatBaris2}`}<br/>
                    {selectedOrder.kota}, {selectedOrder.provinsi} {selectedOrder.kodePos}
                  </p>
                </div>
              </div>

              {/* Daftar Items - GAMBAR MUNCUL SAMA SEPERTI CUSTOMER */}
              <div>
                <h3 className="font-bold text-gray-900 mb-6 text-xl">Daftar Produk ({selectedOrder.items.length} item)</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-2xl p-5 flex gap-5">
                      <img
                        src={
                          item.variant?.gambar || 
                          item.variant?.gambarUrl || 
                          item.product?.gambarUtama || 
                          (item.product?.gambarUrl ? item.product.gambarUrl.split('|||')[0] : null) ||
                          item.gambarSnapshot ||
                          `https://placehold.co/100x100/cccccc/ffffff?text=${encodeURIComponent(item.namaProduk?.charAt(0) || 'P')}`
                        }
                        alt={item.namaProduk}
                        className="w-24 h-24 object-cover rounded-xl bg-gray-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/100x100/cccccc/ffffff?text=${encodeURIComponent(item.namaProduk?.charAt(0) || 'P')}`;
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{item.namaProduk}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.ukuranVariant && `${item.ukuranVariant} • `}
                          {item.warnaVariant}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{item.kuantitas} × {formatPrice(item.hargaSnapshot)}</span>
                          <span className="font-bold text-lg text-[#cb5094]">{formatPrice(item.subtotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
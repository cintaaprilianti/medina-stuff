import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, Eye, MapPin, User, X, 
  Search, Filter, RefreshCw, ChevronDown, DollarSign, Menu,
  ShoppingBag
} from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

function Notification({ type, message, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose && onClose(), 300);
  };

  const configs = {
    success: { bgColor: 'bg-green-500', shadowColor: 'shadow-green-500/50' },
    error: { bgColor: 'bg-red-500', shadowColor: 'shadow-red-500/50' },
    warning: { bgColor: 'bg-yellow-500', shadowColor: 'shadow-yellow-500/50' }
  };
  const config = configs[type] || configs.success;
  const Icon = type === 'success' ? CheckCircle : type === 'warning' ? AlertCircle : XCircle;

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
      isExiting ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'
    }`}>
      <div className={`flex items-center gap-3 ${config.bgColor} text-white rounded-full px-6 py-3.5 shadow-2xl ${config.shadowColor} min-w-[300px] max-w-lg backdrop-blur-md border border-white/20`}>
        <Icon className="w-6 h-6 flex-shrink-0" />
        <p className="text-sm font-medium flex-1 text-center">{message}</p>
        <button onClick={handleClose} className="hover:bg-white/20 rounded-full p-1.5 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function AdminOrders() {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateShipment, setShowUpdateShipment] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: 'SHIPPED', nomorResi: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Notifikasi
  const [notification, setNotification] = useState(null);
  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/orders/admin/all', {
        params: {
          page: 1,
          limit: 1000
        }
      });
      
      const ordersData = response.data.data || response.data.orders || [];
      
      console.log('📊 Raw Orders Data dari BE:', ordersData); // ← CEK DI CONSOLE APAKAH ADA total/subtotal/ongkosKirim
      
      // Enrich dengan shipment untuk tombol update
      const enrichedOrders = await Promise.all(ordersData.map(async (order) => {
        try {
          const shipmentRes = await api.get(`/shipments/order/${order.id}/track`);
          return { ...order, shipment: shipmentRes.data.shipment || shipmentRes.data };
        } catch (err) {
          return { ...order, shipment: null };
        }
      }));

      const sortedOrders = enrichedOrders.sort((a, b) => 
        new Date(b.dibuatPada || b.createdAt) - new Date(a.dibuatPada || a.createdAt)
      );
      
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Gagal memuat pesanan:', err);
      showNotification('error', 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const mapStatusToConfig = (status) => {
    const config = {
      PENDING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      PAID: { label: 'Dibayar', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      PROCESSING: { label: 'Diproses', color: 'bg-purple-100 text-purple-700', icon: Package },
      SHIPPED: { label: 'Dikirim', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
      COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return config[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-700', icon: Package };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper untuk hitung total order (fallback aman)
  const getOrderTotal = (order) => {
    const total = Number(order.total || 0);
    if (total > 0) return total;
    const subtotal = Number(order.subtotal || 0);
    const ongkir = Number(order.ongkosKirim || order.ongkir || 0);
    return subtotal + ongkir;
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus && order.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!order.nomorOrder?.toLowerCase().includes(query) &&
          !order.namaPenerima?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ TOTAL PENDAPATAN DIPERBAIKI: Pakai getOrderTotal()
  const totalRevenue = filteredOrders
    .filter(o => ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(o.status))
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openCreateShipment = (order) => {
    navigate(`/admin/shipments?orderId=${order.id}`);
  };

  const openUpdateShipment = async (order) => {
    try {
      const res = await api.get(`/shipments/order/${order.id}/track`);
      const shipment = res.data.shipment || res.data;
      
      if (!shipment) {
        showNotification('warning', 'Pengiriman belum dibuat untuk order ini');
        return;
      }
      
      setSelectedShipment(shipment);
      setUpdateForm({
        status: ['PENDING', 'READY_TO_SHIP'].includes(shipment.status) ? 'SHIPPED' : 'DELIVERED',
        nomorResi: shipment.nomorResi || ''
      });
      setShowUpdateShipment(true);
    } catch (err) {
      if (err.response?.status === 404) {
        showNotification('warning', 'Pengiriman belum dibuat. Klik tombol "Kirim" untuk membuat.');
      } else {
        showNotification('error', 'Gagal memuat data pengiriman');
      }
    }
  };

  const handleUpdateShipment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/shipments/${selectedShipment.id}/status`, updateForm);
      showNotification('success', 'Status pengiriman berhasil diupdate!');
      setShowUpdateShipment(false);
      loadOrders();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Gagal update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 pb-20 lg:pb-0">
      {notification && (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                <ShoppingBag className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manajemen Pesanan</h1>
                <p className="text-gray-500 text-sm lg:text-base">Kelola semua pesanan pelanggan</p>
              </div>
            </div>
            <button
              onClick={loadOrders}
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b34583] transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-[#cb5094] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Pendapatan</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{formatPrice(totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-pink-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 text-[#cb5094]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Pesanan</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{filteredOrders.length}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-50 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 lg:w-7 lg:h-7 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Menunggu Proses</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">
                  {filteredOrders.filter(o => o.status === 'PAID' || o.status === 'PROCESSING').length}
                </p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Filter Pesanan</h3>
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl"
            >
              {showMobileFilter ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              Filter
            </button>
          </div>

          <div className={`${showMobileFilter ? 'block' : 'hidden lg:block'} space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nomor order / nama customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] appearance-none"
                >
                  <option value="">Semua Status</option>
                  <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
                  <option value="PAID">Dibayar</option>
                  <option value="PROCESSING">Diproses</option>
                  <option value="SHIPPED">Dikirim</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="pt-4 text-sm text-gray-600">
              Menampilkan <span className="font-bold text-[#cb5094]">{filteredOrders.length}</span> pesanan
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Memuat pesanan...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-8 text-center">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-[#cb5094]" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Tidak Ada Pesanan</h3>
            <p className="text-gray-600">Belum ada pesanan dengan filter ini</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {paginatedOrders.map(order => {
                const statusConfig = mapStatusToConfig(order.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{order.nomorOrder}</h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{formatDate(order.dibuatPada)}</p>
                    <p className="font-medium text-gray-800 mb-1">{order.namaPenerima}</p>
                    <p className="text-sm text-gray-500 mb-3">{order.items?.length || 0} item • <span className="font-bold text-[#cb5094]">{formatPrice(order.total)}</span></p>
                    <div className="flex gap-2">
                      <button onClick={() => handleViewDetail(order)} className="flex-1 py-2 bg-[#cb5094] text-white rounded-xl font-medium flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" /> Detail
                      </button>
                      {(order.status === 'PAID' || order.status === 'PROCESSING') && !order.shipment && (
                        <button onClick={() => openCreateShipment(order)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                          <Truck className="w-4 h-4" /> Kirim
                        </button>
                      )}
                      {(order.status === 'PROCESSING' || order.status === 'SHIPPED') && order.shipment && (
                        <button onClick={() => openUpdateShipment(order)} className="flex-1 py-2 bg-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                          <Package className="w-4 h-4" /> Update
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-pink-50 to-white border-b-2 border-pink-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">No. Order</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Item</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Total</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedOrders.map(order => {
                      const statusConfig = mapStatusToConfig(order.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <tr key={order.id} className="hover:bg-pink-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">{order.nomorOrder}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.dibuatPada)}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{order.namaPenerima}</p>
                              <p className="text-xs text-gray-500">{order.teleponPenerima}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">{order.items?.length || 0}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#cb5094]">{formatPrice(order.total)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => handleViewDetail(order)} className="p-2 text-[#cb5094] hover:bg-pink-100 rounded-lg transition-all">
                                <Eye className="w-5 h-5" />
                              </button>
                              {(order.status === 'PAID' || order.status === 'PROCESSING') && !order.shipment && (
                                <button onClick={() => openCreateShipment(order)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all">
                                  <Truck className="w-5 h-5" />
                                </button>
                              )}
                              {(order.status === 'PROCESSING' || order.status === 'SHIPPED') && order.shipment && (
                                <button onClick={() => openUpdateShipment(order)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all">
                                  <Package className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 py-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-pink-50 hover:border-[#cb5094] font-medium"
            >
              ← Previous
            </button>
            <span className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-pink-50 hover:border-[#cb5094] font-medium"
            >
              Next →
            </button>
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
                  <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${mapStatusToConfig(selectedOrder.status).color} shadow-lg`}>
                    {(() => {
                      const StatusIcon = mapStatusToConfig(selectedOrder.status).icon;
                      return <StatusIcon className="w-6 h-6" />;
                    })()}
                    <span className="text-lg font-bold">{mapStatusToConfig(selectedOrder.status).label}</span>
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

              {/* Daftar Items */}
              <div>
                <h3 className="font-bold text-gray-900 mb-6 text-xl">Daftar Produk ({selectedOrder.items?.length || 0} item)</h3>
                <div className="space-y-4">
                  {(selectedOrder.items || []).map((item, idx) => (
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

      {/* Modal Update Status Pengiriman */}
      {showUpdateShipment && selectedShipment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowUpdateShipment(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-t-3xl">
              <h3 className="text-xl font-bold">Update Status Pengiriman</h3>
              <p className="text-sm opacity-90 mt-1">Resi: {selectedShipment.nomorResi || 'Belum ada'}</p>
            </div>

            <form onSubmit={handleUpdateShipment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status Baru</label>
                <select 
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  {selectedShipment.status === 'PENDING' && <option value="SHIPPED">Dikirim</option>}
                  {(selectedShipment.status === 'PENDING' || selectedShipment.status === 'SHIPPED') && <option value="DELIVERED">Diterima</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Resi (opsional)</label>
                <input 
                  type="text" 
                  placeholder="Update nomor resi jika berubah"
                  value={updateForm.nomorResi}
                  onChange={(e) => setUpdateForm({...updateForm, nomorResi: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowUpdateShipment(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-70"
                >
                  {submitting ? 'Mengupdate...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
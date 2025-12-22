import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Truck, Package, Clock, CheckCircle, XCircle, RefreshCw, 
  Eye, Search, Filter, ChevronDown, Menu, X, AlertCircle, Globe, Plus
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

function AdminShipments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterKurir, setFilterKurir] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrderForCreate, setSelectedOrderForCreate] = useState(null);
  const [createForm, setCreateForm] = useState({ kurir: '', layanan: '', nomorResi: '', biaya: '' });
  const [updateForm, setUpdateForm] = useState({ status: 'SHIPPED', nomorResi: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  useEffect(() => {
    loadShipments();
    const interval = setInterval(loadShipments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (urlOrderId) {
      fetchOrderForCreate(urlOrderId);
    }
  }, [urlOrderId]);

  const fetchOrderForCreate = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      const order = res.data.order || res.data;
      
      setSelectedOrderForCreate(order);
      setCreateForm({ kurir: '', layanan: '', nomorResi: '', biaya: '' });
      setShowCreateModal(true);
    } catch (err) {
      console.error('Fetch order error:', err);
      showNotification('error', err.response?.data?.message || 'Gagal memuat data order');
      setSearchParams({});
    }
  };

  const loadShipments = async () => {
    try {
      setLoading(true);

      const ordersResponse = await api.get('/orders/admin/all', {
        params: { limit: 1000 }
      });

      const orders = ordersResponse.data.data || ordersResponse.data.orders || [];
      const shipmentsData = [];

      for (const order of orders) {
        try {
          const shipmentRes = await api.get(`/shipments/order/${order.id}/track`);
          const shipment = shipmentRes.data.shipment || shipmentRes.data;

          if (shipment) {
            shipmentsData.push({
              ...shipment,
              order: {
                id: order.id,
                nomorOrder: order.nomorOrder,
                namaPenerima: order.namaPenerima,
                total: order.total,
                status: order.status
              }
            });
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.warn(`Error fetching shipment for order ${order.id}:`, err.message);
          }
          continue;
        }
      }

      shipmentsData.sort((a, b) => {
        const dateA = new Date(a.dibuatPada || a.createdAt || 0);
        const dateB = new Date(b.dibuatPada || b.createdAt || 0);
        return dateB - dateA;
      });

      setShipments(shipmentsData);
    } catch (err) {
      console.error('Gagal memuat pengiriman:', err);
      showNotification('error', 'Gagal memuat data pengiriman');
    } finally {
      setLoading(false);
    }
  };

  const mapStatusToConfig = (status) => {
    const normalized = status?.toString().toUpperCase();
    const config = {
      'PENDING': { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'READY_TO_SHIP': { label: 'Siap Dikirim', color: 'bg-orange-100 text-orange-700', icon: Package },
      'SHIPPED': { label: 'Dikirim', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
      'IN_TRANSIT': { label: 'Dalam Perjalanan', color: 'bg-blue-100 text-blue-700', icon: Truck },
      'DELIVERED': { label: 'Diterima', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'CANCELLED': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle },
      'CANCELED': { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return config[normalized] || { 
      label: status || 'Unknown', 
      color: 'bg-gray-100 text-gray-700', 
      icon: Package 
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '-';
    }
  };

  const filteredShipments = shipments.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterKurir !== 'all' && s.kurir?.toLowerCase() !== filterKurir.toLowerCase()) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!s.nomorResi?.toLowerCase().includes(query) &&
          !s.order?.nomorOrder?.toLowerCase().includes(query) &&
          !s.order?.namaPenerima?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const handleViewDetail = (shipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(true);
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    
    if (!createForm.kurir || !createForm.nomorResi || !createForm.biaya) {
      showNotification('warning', 'Kurir, nomor resi, dan biaya wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/shipments', {
        orderId: selectedOrderForCreate.id,
        kurir: createForm.kurir,
        layanan: createForm.layanan,
        nomorResi: createForm.nomorResi,
        biaya: parseInt(createForm.biaya, 10)
      });
      
      showNotification('success', 'Pengiriman berhasil dibuat!');
      setShowCreateModal(false);
      setSearchParams({});
      
      setTimeout(() => {
        loadShipments();
      }, 1000);
      
    } catch (err) {
      console.error('Create shipment error:', err);
      showNotification('error', err.response?.data?.message || err.message || 'Gagal membuat pengiriman');
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdateModal = (shipment) => {
    setSelectedShipment(shipment);
    setUpdateForm({
      status: shipment.status === 'PENDING' || shipment.status === 'READY_TO_SHIP' ? 'SHIPPED' : 'DELIVERED',
      nomorResi: shipment.nomorResi || ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateShipment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await api.put(`/shipments/${selectedShipment.id}/status`, {
        status: updateForm.status,
        nomorResi: updateForm.nomorResi || undefined
      });
      
      showNotification('success', 'Status pengiriman berhasil diupdate!');
      setShowUpdateModal(false);
      loadShipments();
    } catch (err) {
      console.error('Update shipment error:', err);
      showNotification('error', err.response?.data?.message || err.message || 'Gagal update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncTracking = async (shipmentId) => {
    try {
      await api.get(`/shipments/${shipmentId}/tracking`);
      showNotification('success', 'Sync tracking berhasil!');
      loadShipments();
    } catch (err) {
      console.error('Sync tracking error:', err);
      showNotification('error', err.response?.data?.message || 'Gagal sync tracking');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20 lg:pb-0">
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
                <Truck className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manajemen Pengiriman</h1>
                <p className="text-gray-500 text-sm lg:text-base">Buat, pantau, dan update pengiriman pesanan</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/admin/orders'}
                className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Buat Pengiriman</span>
                <span className="sm:hidden">Buat</span>
              </button>
              <button
                onClick={loadShipments}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-[#cb5094] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Pengiriman</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{shipments.length}</p>
              </div>
              <Truck className="w-10 h-10 text-[#cb5094]" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Menunggu</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {shipments.filter(s => s.status === 'PENDING' || s.status === 'READY_TO_SHIP').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-indigo-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Dikirim</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {shipments.filter(s => s.status === 'SHIPPED').length}
                </p>
              </div>
              <Truck className="w-10 h-10 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Diterima</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {shipments.filter(s => s.status === 'DELIVERED').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Filter Pengiriman</h3>
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl"
            >
              {showMobileFilter ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              Filter
            </button>
          </div>

          <div className={`${showMobileFilter ? 'block' : 'hidden lg:block'} space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari resi / order / customer..."
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
                  <option value="all">Semua Status</option>
                  <option value="PENDING">Menunggu</option>
                  <option value="SHIPPED">Dikirim</option>
                  <option value="DELIVERED">Diterima</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterKurir}
                  onChange={(e) => setFilterKurir(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] appearance-none"
                >
                  <option value="all">Semua Kurir</option>
                  <option value="JNE">JNE</option>
                  <option value="J&T">J&T</option>
                  <option value="SiCepat">SiCepat</option>
                  <option value="Pos Indonesia">Pos Indonesia</option>
                  <option value="Ninja Xpress">Ninja Xpress</option>
                  <option value="Tiki">Tiki</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="pt-4 text-sm text-gray-600">
              Menampilkan <span className="font-bold text-[#cb5094]">{filteredShipments.length}</span> pengiriman
            </div>
          </div>
        </div>

        {/* List Pengiriman */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Memuat pengiriman...</p>
            </div>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-12 text-center">
            <Truck className="w-20 h-20 text-[#cb5094]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Pengiriman</h3>
            <p className="text-gray-600 mb-6">Pengiriman akan muncul setelah dibuat dari halaman Pesanan</p>
            <button
              onClick={() => window.location.href = '/admin/orders'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Buat Pengiriman
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredShipments.map(shipment => {
                const statusConfig = mapStatusToConfig(shipment.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={shipment.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{shipment.nomorResi || 'Belum ada resi'}</h3>
                        <p className="text-sm text-gray-500 mt-1">Order: {shipment.order?.nomorOrder}</p>
                        <p className="text-sm text-gray-600">{shipment.order?.namaPenerima}</p>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="w-5 h-5" />
                        <span className="font-medium text-sm">{statusConfig.label}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <p><span className="font-medium">Kurir:</span> {shipment.kurir || '-'}</p>
                      <p><span className="font-medium">Layanan:</span> {shipment.layanan || '-'}</p>
                      <p><span className="font-medium">Biaya:</span> {formatPrice(shipment.biaya)}</p>
                      {shipment.biteshipOrderId && (
                        <p className="inline-flex items-center gap-2 text-[#cb5094]">
                          <Globe className="w-4 h-4" />
                          Otomatis via Biteship
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(shipment)}
                        className="flex-1 py-3 bg-[#cb5094] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>
                      <button
                        onClick={() => openUpdateModal(shipment)}
                        className="px-4 py-3 bg-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Update
                      </button>
                      {shipment.biteshipOrderId && (
                        <button
                          onClick={() => handleSyncTracking(shipment.id)}
                          className="px-4 py-3 bg-[#cb5094]/20 text-[#cb5094] rounded-xl font-medium flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
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
                  <thead className="bg-gradient-to-r from-pink-50 to-purple-50 border-b-2 border-pink-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">No. Resi</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Order</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Kurir & Layanan</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Biaya</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Sistem</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredShipments.map(shipment => {
                      const statusConfig = mapStatusToConfig(shipment.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <tr key={shipment.id} className="hover:bg-pink-50/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {shipment.nomorResi || <span className="text-gray-400 italic">Belum ada</span>}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{shipment.order?.nomorOrder}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{shipment.order?.namaPenerima}</p>
                              <p className="text-xs text-gray-500">{formatPrice(shipment.order?.total)}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{shipment.kurir || '-'}</span>
                            {shipment.layanan && <span className="text-xs text-gray-500 block">{shipment.layanan}</span>}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#cb5094]">{formatPrice(shipment.biaya)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${statusConfig.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {shipment.biteshipOrderId ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#cb5094]/20 text-[#cb5094] text-xs font-bold rounded-full">
                                <Globe className="w-4 h-4" />
                                Biteship
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Manual</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleViewDetail(shipment)}
                                className="p-2 text-[#cb5094] hover:bg-pink-100 rounded-lg transition-all"
                                title="Lihat Detail"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openUpdateModal(shipment)}
                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                                title="Update Status"
                              >
                                <Package className="w-5 h-5" />
                              </button>
                              {shipment.biteshipOrderId && (
                                <button
                                  onClick={() => handleSyncTracking(shipment.id)}
                                  className="p-2 text-[#cb5094] hover:bg-pink-100 rounded-lg transition-all"
                                  title="Sync Tracking"
                                >
                                  <RefreshCw className="w-5 h-5" />
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

        {/* Modal Buat Pengiriman */}
        {showCreateModal && selectedOrderForCreate && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => {
            setShowCreateModal(false);
            setSearchParams({});
          }}>
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-4 rounded-t-3xl">
                <h3 className="text-xl font-bold">Buat Pengiriman</h3>
                <p className="text-sm opacity-90 mt-1">Pesanan #{selectedOrderForCreate.nomorOrder}</p>
              </div>

              <form onSubmit={handleCreateShipment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kurir *</label>
                  <select 
                    value={createForm.kurir}
                    onChange={(e) => setCreateForm({...createForm, kurir: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] focus:outline-none"
                    required
                  >
                    <option value="">Pilih Kurir</option>
                    <option>JNE</option>
                    <option>J&T</option>
                    <option>SiCepat</option>
                    <option>Pos Indonesia</option>
                    <option>Ninja Xpress</option>
                    <option>Tiki</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Layanan</label>
                  <input 
                    type="text" 
                    placeholder="REG, YES, OKE, dll"
                    value={createForm.layanan}
                    onChange={(e) => setCreateForm({...createForm, layanan: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Resi *</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nomor resi"
                    value={createForm.nomorResi}
                    onChange={(e) => setCreateForm({...createForm, nomorResi: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Biaya Pengiriman (Rp) *</label>
                  <input 
                    type="number" 
                    placeholder="15000"
                    value={createForm.biaya}
                    onChange={(e) => setCreateForm({...createForm, biaya: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] focus:outline-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setSearchParams({});
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-70"
                  >
                    {submitting ? 'Membuat...' : 'Buat Pengiriman'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Update Status */}
        {showUpdateModal && selectedShipment && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowUpdateModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-4 rounded-t-3xl">
                <h3 className="text-xl font-bold">Update Status Pengiriman</h3>
                <p className="text-sm opacity-90 mt-1">Resi: {selectedShipment.nomorResi || 'Belum ada'}</p>
              </div>

              <form onSubmit={handleUpdateShipment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status Baru</label>
                  <select 
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] focus:outline-none"
                  >
                    {(selectedShipment.status === 'PENDING' || selectedShipment.status === 'READY_TO_SHIP') && <option value="SHIPPED">Dikirim</option>}
                    {(selectedShipment.status === 'PENDING' || selectedShipment.status === 'READY_TO_SHIP' || selectedShipment.status === 'SHIPPED') && <option value="DELIVERED">Diterima</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Resi (opsional)</label>
                  <input 
                    type="text" 
                    placeholder="Update nomor resi jika berubah"
                    value={updateForm.nomorResi}
                    onChange={(e) => setUpdateForm({...updateForm, nomorResi: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-70"
                  >
                    {submitting ? 'Mengupdate...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detail Pengiriman */}
        {showDetailModal && selectedShipment && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-6 flex justify-between items-center rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold">Detail Pengiriman</h2>
                  <p className="text-white/90 mt-1">Resi: {selectedShipment.nomorResi || 'Belum tersedia'}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-4">Informasi Pengiriman</h3>
                    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${mapStatusToConfig(selectedShipment.status).color}`}>
                          {(() => {
                            const Icon = mapStatusToConfig(selectedShipment.status).icon;
                            return <Icon className="w-5 h-5" />;
                          })()}
                          <span className="font-bold">{mapStatusToConfig(selectedShipment.status).label}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kurir</span>
                        <span className="font-bold">{selectedShipment.kurir || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Layanan</span>
                        <span className="font-bold">{selectedShipment.layanan || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Biaya</span>
                        <span className="font-bold text-[#cb5094]">{formatPrice(selectedShipment.biaya)}</span>
                      </div>
                      {selectedShipment.estimasiPengiriman && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimasi</span>
                          <span className="font-bold">{formatDate(selectedShipment.estimasiPengiriman)}</span>
                        </div>
                      )}
                      {selectedShipment.dikirimPada && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dikirim</span>
                          <span className="font-bold text-[#cb5094]">{formatDate(selectedShipment.dikirimPada)}</span>
                        </div>
                      )}
                      {selectedShipment.diterimaPada && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Diterima</span>
                          <span className="font-bold text-green-600">{formatDate(selectedShipment.diterimaPada)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-4">Informasi Order</h3>
                    <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                      <p><span className="font-medium">Order:</span> <span className="font-bold">{selectedShipment.order?.nomorOrder}</span></p>
                      <p><span className="font-medium">Customer:</span> <span className="font-bold">{selectedShipment.order?.namaPenerima}</span></p>
                      <p><span className="font-medium">Total:</span> <span className="font-bold text-[#cb5094]">{formatPrice(selectedShipment.order?.total)}</span></p>
                      {selectedShipment.biteshipOrderId && (
                        <p className="inline-flex items-center gap-2 text-[#cb5094] mt-3">
                          <Globe className="w-5 h-5" />
                          Terintegrasi dengan Biteship
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedShipment.courierTrackingUrl && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 text-center">
                    <a
                      href={selectedShipment.courierTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-xl font-bold hover:shadow-xl transition-all"
                    >
                      <Truck className="w-6 h-6" />
                      Lacak di Website Kurir
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminShipments;
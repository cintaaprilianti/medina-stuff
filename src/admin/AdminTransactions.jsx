import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Wallet, 
  Banknote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Receipt, 
  Undo2,
  ChevronDown,
  DollarSign,
  Menu,
  X,
  Package,
  RotateCcw
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
    error: { bgColor: 'bg-red-500', shadowColor: 'shadow-red-500/50' }
  };
  const config = configs[type] || configs.success;
  const Icon = type === 'success' ? CheckCircle : XCircle;

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

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [notification, setNotification] = useState(null);
  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      const ordersResponse = await api.get('/orders/admin/all', {
        params: { page: 1, limit: 1000 }
      });
      
      const orders = ordersResponse.data.data || ordersResponse.data.orders || [];

      const transactionsPromises = orders.map(async (order) => {
        try {
          const paymentResponse = await api.get(`/payments/order/${order.id}`);
          const payments = paymentResponse.data.payments || [];
          
          // Ambil payment terbaru atau yang SETTLEMENT
          const sortedPayments = payments.sort((a, b) => 
            new Date(b.dibuatPada || b.createdAt) - new Date(a.dibuatPada || a.createdAt)
          );
          const activePayment = sortedPayments.find(p => p.status === 'SETTLEMENT') || sortedPayments[0];
          
          if (activePayment) {
            // ✅ Process items dengan gambar
            const processedItems = (order.items || []).map(item => ({
              ...item,
              gambarUrl: item.variant?.gambar || 
                        item.product?.gambarUtama || 
                        (item.product?.gambarUrl ? item.product.gambarUrl.split('|||')[0] : null) || 
                        'https://via.placeholder.com/100?text=No+Image'
            }));

            return {
              ...activePayment,
              // ✅ Tambahkan order dengan items yang sudah di-process
              order: {
                ...order,
                items: processedItems
              }
            };
          }
          return null;
        } catch (err) {
          console.error(`Error loading payment for order ${order.id}:`, err);
          return null;
        }
      });

      const transactions = (await Promise.all(transactionsPromises)).filter(Boolean);
      transactions.sort((a, b) => 
        new Date(b.dibuatPada || b.createdAt) - new Date(a.dibuatPada || a.createdAt)
      );

      console.log('Loaded transactions:', transactions); // Debug
      setTransactions(transactions);
    } catch (err) {
      console.error('Gagal memuat transaksi:', err);
      showNotification('error', 'Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange.start && !dateRange.end) return '';
    
    const startStr = dateRange.start 
      ? new Date(dateRange.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      : '...';
    
    const endStr = dateRange.end
      ? new Date(dateRange.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '...';
    
    return `${startStr} - ${endStr}`;
  };

  const hasActiveFilters = () => {
    return filterStatus !== 'all' || 
           filterMethod !== 'all' || 
           searchQuery !== '' || 
           dateRange.start !== '' || 
           dateRange.end !== '';
  };

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterMethod('all');
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    showNotification('success', 'Filter direset!');
  };

  const filteredTransactions = transactions.filter(trans => {
    if (filterStatus !== 'all' && trans.status !== filterStatus) return false;
    if (filterMethod !== 'all' && trans.metode !== filterMethod) return false;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (!trans.transactionId?.toLowerCase().includes(searchLower) &&
          !trans.order?.nomorOrder?.toLowerCase().includes(searchLower) &&
          !trans.order?.namaPenerima?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (dateRange.start || dateRange.end) {
      const transDate = new Date(trans.dibuatPada || trans.createdAt);
      
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (transDate < startDate) return false;
      }
      
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (transDate > endDate) return false;
      }
    }
    
    return true;
  });

  // ✅ FIX: Gunakan field 'jumlah' dari backend (bukan 'amount')
  const totalRevenue = filteredTransactions
    .filter(t => ['SETTLEMENT', 'SETTLED', 'CAPTURE'].includes(t.status?.toUpperCase()))
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  const mapStatusToConfig = (status) => {
    const normalizedStatus = status?.toString().toUpperCase();
    
    const config = {
      'PENDING': { label: 'Menunggu', color: 'bg-yellow-500', icon: Clock },
      'SETTLEMENT': { label: 'Berhasil', color: 'bg-green-500', icon: CheckCircle },
      'SETTLED': { label: 'Berhasil', color: 'bg-green-500', icon: CheckCircle },
      'CANCEL': { label: 'Dibatalkan', color: 'bg-red-500', icon: XCircle },
      'CANCELLED': { label: 'Dibatalkan', color: 'bg-red-500', icon: XCircle },
      'EXPIRE': { label: 'Kadaluarsa', color: 'bg-gray-500', icon: AlertCircle },
      'EXPIRED': { label: 'Kadaluarsa', color: 'bg-gray-500', icon: AlertCircle },
      'REFUND': { label: 'Direfund', color: 'bg-purple-500', icon: Undo2 },
      'REFUNDED': { label: 'Direfund', color: 'bg-purple-500', icon: Undo2 },
      'CAPTURE': { label: 'Dikonfirmasi', color: 'bg-blue-500', icon: CheckCircle },
      'DENY': { label: 'Ditolak', color: 'bg-red-500', icon: XCircle },
      'DENIED': { label: 'Ditolak', color: 'bg-red-500', icon: XCircle },
    };
    
    return config[normalizedStatus] || { 
      label: status || 'Unknown', 
      color: 'bg-gray-500', 
      icon: AlertCircle 
    };
  };

  const mapMethodToConfig = (method) => {
    const normalizedMethod = method?.toString().toUpperCase();
    
    const config = {
      'BANK_TRANSFER': { label: 'Virtual Account', icon: Banknote },
      'QRIS': { label: 'QRIS', icon: QrCode },
      'E_WALLET': { label: 'E-Wallet', icon: Wallet },
      'CREDIT_CARD': { label: 'Kartu Kredit', icon: CreditCard },
    };
    
    return config[normalizedMethod] || { 
      label: method || 'Unknown', 
      icon: CreditCard 
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      showNotification('error', 'Alasan refund wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/payments/${selectedTransaction.id}/refund`, { reason: refundReason });
      showNotification('success', 'Refund berhasil diproses!');
      setShowRefundModal(false);
      setRefundReason('');
      loadTransactions();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Gagal proses refund');
    } finally {
      setSubmitting(false);
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
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-[#cb5094] rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Kelola Transaksi</h1>
                <p className="text-gray-500 text-sm lg:text-base">Pantau dan kelola pembayaran pelanggan</p>
              </div>
            </div>
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

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Transaksi</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{filteredTransactions.length}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 lg:w-7 lg:h-7 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Menunggu Konfirmasi</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">
                  {filteredTransactions.filter(t => t.status === 'PENDING').length}
                </p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter - Keep the same */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-5 border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800">Filter Transaksi</h3>
              {hasActiveFilters() && (
                <span className="px-3 py-1 bg-[#cb5094] text-white text-xs font-bold rounded-full">
                  {filteredTransactions.length} hasil
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters() && (
                <button
                  onClick={resetFilters}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Filter
                </button>
              )}
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl"
              >
                {showMobileFilter ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                Filter
              </button>
            </div>
          </div>

          <div className={`${showMobileFilter ? 'block' : 'hidden lg:block'} space-y-4`}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari transaksi / customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] appearance-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="PENDING">Menunggu</option>
                  <option value="SETTLEMENT">Berhasil</option>
                  <option value="CANCEL">Dibatalkan</option>
                  <option value="EXPIRE">Kadaluarsa</option>
                  <option value="REFUND">Direfund</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] appearance-none"
                >
                  <option value="all">Semua Metode</option>
                  <option value="BANK_TRANSFER">Virtual Account</option>
                  <option value="QRIS">QRIS</option>
                  <option value="E_WALLET">E-Wallet</option>
                  <option value="CREDIT_CARD">Kartu Kredit</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full pl-11 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full pl-11 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-gray-600">
                  Menampilkan <span className="font-bold text-[#cb5094]">{filteredTransactions.length}</span> dari <span className="font-bold">{transactions.length}</span> transaksi
                </p>
                {(dateRange.start || dateRange.end) && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    <Calendar className="w-3 h-3" />
                    {formatDateRange()}
                  </span>
                )}
              </div>
              <button
                onClick={loadTransactions}
                className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b34583] transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>

            {hasActiveFilters() && (
              <button
                onClick={resetFilters}
                className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Semua Filter
              </button>
            )}
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Memuat transaksi...</p>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-8 text-center">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-[#cb5094]" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {hasActiveFilters() ? 'Transaksi Tidak Ditemukan' : 'Belum Ada Transaksi'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters() ? 'Coba ubah atau reset filter pencarian' : 'Transaksi akan muncul saat ada pembayaran dari pelanggan'}
            </p>
            {hasActiveFilters() && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#cb5094] text-white rounded-xl font-semibold hover:bg-[#b34583] transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTransactions.map(trans => {
              const statusConfig = mapStatusToConfig(trans.status);
              const methodConfig = mapMethodToConfig(trans.metode);
              const StatusIcon = statusConfig.icon;
              const MethodIcon = methodConfig.icon;

              return (
                <div 
                  key={trans.id} 
                  className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-[#cb5094]/30 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-[#cb5094] transition-colors truncate">
                        {trans.transactionId}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{formatDate(trans.dibuatPada || trans.createdAt)}</p>
                      <p className="text-sm text-gray-600 truncate">
                        <span className="font-semibold">{trans.order?.namaPenerima}</span>
                      </p>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs ${statusConfig.color} flex-shrink-0 ml-2`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium">{statusConfig.label}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MethodIcon className="w-5 h-5 text-[#cb5094]" />
                      <span className="font-semibold text-sm">{methodConfig.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#cb5094]">{formatPrice(trans.jumlah)}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => handleViewDetail(trans)} 
                      className="w-full flex items-center justify-center gap-2 bg-[#cb5094] text-white py-2.5 rounded-lg font-semibold hover:bg-[#b34583] transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Detail - ✅ Dengan Produk */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-6 flex justify-between items-center rounded-t-3xl z-10">
              <div>
                <h2 className="text-2xl font-bold">Detail Transaksi</h2>
                <p className="text-white/90 mt-1">{selectedTransaction.transactionId}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Payment Info */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#cb5094]" />
                  Informasi Pembayaran
                </h3>
                <div className="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Status</p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white ${mapStatusToConfig(selectedTransaction.status).color}`}>
                      {(() => {
                        const StatusIcon = mapStatusToConfig(selectedTransaction.status).icon;
                        return <StatusIcon className="w-5 h-5" />;
                      })()}
                      <span className="font-bold">{mapStatusToConfig(selectedTransaction.status).label}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm mb-1">Metode Pembayaran</p>
                    {(() => {
                      const methodConfig = mapMethodToConfig(selectedTransaction.metode);
                      const MethodIcon = methodConfig.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <MethodIcon className="w-5 h-5 text-[#cb5094]" />
                          <span className="font-bold">{methodConfig.label}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm mb-1">Jumlah Pembayaran</p>
                    <p className="text-3xl font-bold text-[#cb5094]">{formatPrice(selectedTransaction.jumlah)}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm mb-1">Waktu Transaksi</p>
                    <p className="font-medium">{formatDate(selectedTransaction.dibuatPada || selectedTransaction.createdAt)}</p>
                  </div>

                  {selectedTransaction.waktuSettlement && (
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Waktu Settlement</p>
                      <p className="font-medium text-green-600">{formatDate(selectedTransaction.waktuSettlement)}</p>
                    </div>
                  )}

                  {selectedTransaction.urlPembayaran && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600 text-sm mb-1">Link Pembayaran</p>
                      <a 
                        href={selectedTransaction.urlPembayaran} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#cb5094] underline hover:text-[#b34583] flex items-center gap-1"
                      >
                        Buka halaman pembayaran
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Informasi Pesanan</h3>
                <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Nomor Order</p>
                      <p className="font-bold">{selectedTransaction.order?.nomorOrder}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Nama Penerima</p>
                      <p className="font-bold">{selectedTransaction.order?.namaPenerima}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Telepon</p>
                      <p className="font-medium">{selectedTransaction.order?.teleponPenerima}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Email</p>
                      <p className="font-medium">{selectedTransaction.order?.user?.email || '-'}</p>
                    </div>
                  </div>
                  
                  {selectedTransaction.order?.alamatBaris1 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Alamat Pengiriman</p>
                      <p className="font-medium">
                        {selectedTransaction.order.alamatBaris1}
                        {selectedTransaction.order.alamatBaris2 && `, ${selectedTransaction.order.alamatBaris2}`}
                        <br />
                        {selectedTransaction.order.kota}, {selectedTransaction.order.provinsi} {selectedTransaction.order.kodePos}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ PRODUK YANG DIPESAN */}
              {selectedTransaction.order?.items && selectedTransaction.order.items.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#cb5094]" />
                    Produk yang Dipesan ({selectedTransaction.order.items.length} item)
                  </h3>
                  <div className="space-y-4">
                    {selectedTransaction.order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
                        <img
                          src={item.gambarUrl}
                          alt={item.namaProduk}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=No+Image'}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{item.namaProduk}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.ukuranVariant && `Ukuran: ${item.ukuranVariant}`}
                            {item.ukuranVariant && item.warnaVariant && ' • '}
                            {item.warnaVariant && `Warna: ${item.warnaVariant}`}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-600">
                              {formatPrice(item.hargaSatuan)} × {item.kuantitas}
                            </p>
                            <p className="font-bold text-[#cb5094]">{formatPrice(item.subtotal)}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total Summary */}
                    <div className="bg-[#cb5094]/10 rounded-xl p-5 space-y-2 border-2 border-[#cb5094]/20">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-semibold">{formatPrice(selectedTransaction.order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Ongkos Kirim</span>
                        <span className="font-semibold">{formatPrice(selectedTransaction.order.ongkosKirim)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-[#cb5094]/30">
                        <span className="font-bold text-lg">Total Pembayaran</span>
                        <span className="text-2xl font-bold text-[#cb5094]">{formatPrice(selectedTransaction.jumlah)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedTransaction.status === 'SETTLEMENT' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRefundModal(true);
                    }}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-all flex items-center gap-2"
                  >
                    <Undo2 className="w-5 h-5" />
                    Proses Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Refund */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowRefundModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-t-3xl">
              <h3 className="text-xl font-bold">Proses Refund</h3>
              <p className="text-sm opacity-90 mt-1">{selectedTransaction.transactionId}</p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">Jumlah yang akan direfund:</p>
                <p className="text-3xl font-bold text-purple-600">{formatPrice(selectedTransaction.jumlah)}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Alasan Refund *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Masukkan alasan refund (wajib)"
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundReason('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  onClick={handleRefund}
                  disabled={submitting || !refundReason.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-70"
                >
                  {submitting ? 'Memproses...' : 'Proses Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTransactions;
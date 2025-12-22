import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle, 
  ExternalLink, Package, ArrowLeft, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('BANK_TRANSFER');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Use ref to prevent race conditions
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  const paymentMethods = [
    { 
      value: 'BANK_TRANSFER', 
      label: 'Virtual Account', 
      icon: '🏦',
      description: 'Transfer via BCA, BNI, BRI, Mandiri'
    },
    { 
      value: 'QRIS', 
      label: 'QRIS', 
      icon: '📱',
      description: 'Scan QR dengan GoPay, OVO, Dana, ShopeePay'
    },
    { 
      value: 'E_WALLET', 
      label: 'E-Wallet', 
      icon: '💼',
      description: 'GoPay, OVO, Dana, LinkAja'
    },
    { 
      value: 'CREDIT_CARD', 
      label: 'Kartu Kredit', 
      icon: '💳',
      description: 'Visa, Mastercard, JCB'
    }
  ];

  useEffect(() => {
    loadOrderAndPayment();

    return () => {
      // Cleanup intervals on unmount
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [orderId]);

  // Separate effect for managing auto-refresh
  useEffect(() => {
    // Clear existing intervals
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (payment && payment.status === 'PENDING') {
      // Auto-refresh payment status
      intervalRef.current = setInterval(() => {
        checkPaymentStatus();
      }, 5000);

      // Update countdown timer
      updateTimer(); // Initial call
      timerRef.current = setInterval(() => {
        updateTimer();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [payment?.status, payment?.id]); // Only depend on status and id

  const loadOrderAndPayment = async () => {
    try {
      setLoading(true);
      
      const orderResponse = await api.get(`/orders/${orderId}`);
      const orderData = orderResponse.data.order;
      setOrder({
        ...orderData,
        items: orderData.items.map(item => ({
          ...item,
          gambarUrl: item.variant?.gambar || 
                     item.product?.gambarUtama || 
                     (item.product?.gambarUrl ? item.product.gambarUrl.split('|||')[0] : null) || 
                     'https://via.placeholder.com/100?text=No+Image'
        }))
      });

      // Load payment data
      try {
        const paymentResponse = await api.get(`/payments/order/${orderId}`);
        const payments = paymentResponse.data.payments || [];
        
        // Prioritas: PENDING > SETTLEMENT > lainnya
        const activePayment = payments.find(p => p.status === 'PENDING') || 
                             payments.find(p => p.status === 'SETTLEMENT') ||
                             payments[0];
        setPayment(activePayment);
      } catch (err) {
        // No payment yet - this is okay
        setPayment(null);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Gagal memuat data pesanan';
      toast.error(errMsg);
      navigate('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const paymentResponse = await api.get(`/payments/order/${orderId}`);
      const payments = paymentResponse.data.payments || [];
      const latestPayment = payments.find(p => p.id === payment?.id);
      
      if (latestPayment && latestPayment.status !== payment?.status) {
        setPayment(latestPayment);
        
        if (latestPayment.status === 'SETTLEMENT') {
          toast.success('Pembayaran berhasil dikonfirmasi!');
          setTimeout(() => navigate('/customer/orders'), 2000);
        } else if (['EXPIRE', 'CANCEL', 'DENY'].includes(latestPayment.status)) {
          toast.error('Pembayaran gagal atau kadaluarsa');
        }
      }
    } catch (error) {
      // Silent error - don't disturb user
      console.error('Failed to check payment status:', error);
    }
  };

  const updateTimer = () => {
    if (!payment || payment.status !== 'PENDING' || !payment.kadaluarsaPada) {
      setTimeRemaining('');
      return;
    }
    
    const now = new Date();
    const expiry = new Date(payment.kadaluarsaPada);
    const diff = expiry - now;
    
    if (diff <= 0) {
      setTimeRemaining('Kadaluarsa');
      // Trigger refresh to update status
      checkPaymentStatus();
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`);
  };

  const createPayment = async () => {
    try {
      setCreating(true);

      const response = await api.post('/payments', {
        orderId,
        metode: selectedMethod
      });

      const newPayment = response.data.payment;
      setPayment(newPayment);
      toast.success('Link pembayaran berhasil dibuat!');

      if (newPayment.urlPembayaran) {
        window.open(newPayment.urlPembayaran, '_blank');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Gagal membuat pembayaran';
      
      // Handle specific error cases
      if (errMsg.includes('tidak dapat dibayar') || 
          errMsg.includes('sudah memiliki pembayaran') ||
          errMsg.includes('status') ||
          errMsg.includes('PENDING')) {
        toast.error(errMsg);
        loadOrderAndPayment(); // Refresh to get latest state
      } else {
        toast.error(errMsg);
      }
    } finally {
      setCreating(false);
    }
  };

  const getPaymentStatusConfig = (status) => {
    const configs = {
      PENDING: { label: 'Menunggu Pembayaran', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      SETTLEMENT: { label: 'Berhasil', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
      EXPIRE: { label: 'Kadaluarsa', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300' },
      CANCEL: { label: 'Dibatalkan', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300' },
      DENY: { label: 'Ditolak', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300' },
      REFUND: { label: 'Dikembalikan', icon: AlertCircle, color: 'bg-blue-100 text-blue-800 border-blue-300' }
    };
    return configs[status] || configs.PENDING;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCreatePayment = () => {
    if (!order) return false;
    
    // Check if there's already a pending payment
    if (payment && payment.status === 'PENDING') {
      return false;
    }

    // Check if payment is already successful
    if (payment && payment.status === 'SETTLEMENT') {
      return false;
    }

    // Allow payment for PENDING_PAYMENT status (and similar statuses)
    // Restrict only for cancelled/completed/shipped orders
    const unPayableStatuses = ['CANCELLED', 'COMPLETED', 'SHIPPED', 'DELIVERED'];
    if (unPayableStatuses.includes(order.status)) {
      return false;
    }

    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-pink-50/20 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat detail pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-pink-50/20 flex items-center justify-center py-20">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md border border-pink-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Pesanan Tidak Ditemukan</h2>
          <button
            onClick={() => navigate('/customer/orders')}
            className="mt-6 bg-[#cb5094] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b34583] transition-all"
          >
            Kembali ke Pesanan
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = payment ? getPaymentStatusConfig(payment.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-pink-50/20 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
          <button
            onClick={() => navigate('/customer/orders')}
            className="flex items-center gap-2 text-[#cb5094] font-medium hover:underline mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Pesanan
          </button>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-[#cb5094] rounded-2xl flex items-center justify-center shadow-md">
                <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Pembayaran Pesanan</h1>
                <p className="text-gray-500 text-sm lg:text-base">Nomor Pesanan: <span className="font-bold">{order.nomorOrder}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Pembayaran */}
            {payment && (
              <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Status Pembayaran</h2>
                  {payment.status === 'PENDING' && (
                    <button
                      onClick={checkPaymentStatus}
                      className="text-sm text-[#cb5094] font-medium hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  )}
                </div>

                <div className={`flex items-center gap-4 p-5 rounded-xl border-2 ${statusConfig.color}`}>
                  <StatusIcon className="w-8 h-8" />
                  <div className="flex-1">
                    <p className="font-bold text-lg">{statusConfig.label}</p>
                    <p className="text-sm text-gray-600">ID Transaksi: {payment.transactionId}</p>
                  </div>
                </div>

                {payment.status === 'PENDING' && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-yellow-600" />
                        <div>
                          <p className="font-semibold text-yellow-800">Sisa waktu pembayaran</p>
                          <p className="text-2xl font-bold text-yellow-900">{timeRemaining || 'Menghitung...'}</p>
                          <p className="text-xs text-yellow-700">Kadaluarsa: {formatDateTime(payment.kadaluarsaPada)}</p>
                        </div>
                      </div>
                    </div>

                    {payment.urlPembayaran && (
                      <a
                        href={payment.urlPembayaran}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                      >
                        <CreditCard className="w-6 h-6" />
                        Buka Halaman Pembayaran
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}

                {payment.status === 'SETTLEMENT' && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-bold text-green-800 text-lg">Pembayaran Berhasil!</p>
                        <p className="text-sm text-green-700">Diterima pada {formatDateTime(payment.waktuSettlement)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {['EXPIRE', 'CANCEL', 'DENY'].includes(payment.status) && canCreatePayment() && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <p className="font-bold text-red-800 text-lg">
                        Pembayaran {payment.status === 'EXPIRE' ? 'Kadaluarsa' : 'Gagal'}
                      </p>
                    </div>
                    <button
                      onClick={() => setPayment(null)}
                      className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition"
                    >
                      Buat Pembayaran Baru
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pilih Metode Pembayaran */}
            {!payment && canCreatePayment() && (
              <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Pilih Metode Pembayaran</h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setSelectedMethod(method.value)}
                      className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                        selectedMethod === method.value
                          ? 'border-[#cb5094] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-3xl">{method.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900">{method.label}</p>
                          <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={createPayment}
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-6 h-6" />
                  {creating ? 'Membuat Link...' : 'Buat Link Pembayaran'}
                </button>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <AlertCircle className="w-5 h-5 inline mr-2" />
                  Anda akan diarahkan ke halaman pembayaran Midtrans yang aman
                </div>
              </div>
            )}

            {/* Warning jika order tidak bisa dibayar */}
            {!canCreatePayment() && !payment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <p className="font-bold text-yellow-800">Pesanan Tidak Dapat Dibayar</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Status pesanan saat ini: <span className="font-semibold">{order.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Daftar Produk */}
            <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#cb5094]" />
                Produk yang Dipesan
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                    <img
                      src={item.gambarUrl}
                      alt={item.namaProduk}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=No+Image'}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.namaProduk}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.ukuranVariant && `Ukuran: ${item.ukuranVariant} • `}
                        {item.warnaVariant && `Warna: ${item.warnaVariant}`}
                      </p>
                      <p className="text-sm text-gray-600">Jumlah: {item.kuantitas}</p>
                      <p className="font-bold text-[#cb5094] mt-2">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ringkasan Pesanan */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-5">Ringkasan Pesanan</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ongkos Kirim</span>
                  <span className="font-semibold">{formatPrice(order.ongkosKirim)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Total Bayar</span>
                    <span className="font-bold text-2xl text-[#cb5094]">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <p className="font-semibold text-gray-800 mb-2">Alamat Pengiriman</p>
                <p className="font-medium">{order.namaPenerima}</p>
                <p>{order.teleponPenerima}</p>
                <p className="mt-2 text-gray-700">
                  {order.alamatBaris1}
                  {order.alamatBaris2 && `, ${order.alamatBaris2}`}
                  <br />
                  {order.kota}, {order.provinsi} {order.kodePos}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerPayment;
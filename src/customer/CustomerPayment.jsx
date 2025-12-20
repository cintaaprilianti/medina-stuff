import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Package } from 'lucide-react';
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

  const paymentMethods = [
    { 
      value: 'BANK_TRANSFER', 
      label: 'Bank Transfer', 
      icon: '🏦',
      description: 'BCA, BNI, Mandiri, BRI'
    },
    { 
      value: 'QRIS', 
      label: 'QRIS', 
      icon: '📱',
      description: 'Scan QR dengan e-wallet'
    },
    { 
      value: 'E_WALLET', 
      label: 'E-Wallet', 
      icon: '💳',
      description: 'GoPay, OVO, Dana, ShopeePay'
    },
    { 
      value: 'CREDIT_CARD', 
      label: 'Credit Card', 
      icon: '💳',
      description: 'Visa, Mastercard, JCB'
    }
  ];

  useEffect(() => {
    loadOrderAndPayment();
    
    const interval = setInterval(() => {
      if (payment && payment.status === 'PENDING') {
        checkPaymentStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, payment?.status]);

  const loadOrderAndPayment = async () => {
    try {
      setLoading(true);
      
      const orderResponse = await api.get(`/orders/${orderId}`);
      const orderData = orderResponse.data.order;
      setOrder({
        ...orderData,
        items: orderData.items.map(item => ({
          ...item,
          gambarUrl: item.variant?.gambar || item.product?.gambarUtama || (item.product?.gambarUrl ? item.product.gambarUrl.split('|||')[0] : 'https://via.placeholder.com/100?text=No+Image')
        }))
      });

      try {
        const paymentResponse = await api.get(`/payments/order/${orderId}`);
        const payments = paymentResponse.data.payments || [];
      
        const activePayment = payments.find(p => 
          p.status === 'PENDING' || p.status === 'SETTLEMENT'
        ) || payments[0];
        
        setPayment(activePayment);
      } catch (err) {
        setPayment(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data pesanan: ' + (error.response?.data?.message || error.message));
      navigate('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const paymentResponse = await api.get(`/payments/order/${orderId}`);
      const payments = paymentResponse.data.payments || [];
      const latestPayment = payments[0];
      
      if (latestPayment && latestPayment.status !== payment?.status) {
        setPayment(latestPayment);
        
        if (latestPayment.status === 'SETTLEMENT') {
          toast.success('Pembayaran berhasil dikonfirmasi!');
          setTimeout(() => navigate('/customer/orders'), 2000);
        }
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      toast.error('Gagal memeriksa status pembayaran: ' + (error.response?.data?.message || error.message));
    }
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
      toast.success('Payment link berhasil dibuat!');

      if (newPayment.urlPembayaran) {
        window.open(newPayment.urlPembayaran, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Gagal membuat pembayaran: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreating(false);
    }
  };

  const getPaymentStatusConfig = (status) => {
    const configs = {
      PENDING: {
        label: 'Menunggu Pembayaran',
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300'
      },
      SETTLEMENT: {
        label: 'Pembayaran Berhasil',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700 border-green-300'
      },
      EXPIRE: {
        label: 'Kadaluarsa',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-300'
      },
      CANCEL: {
        label: 'Dibatalkan',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-300'
      },
      DENY: {
        label: 'Ditolak',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-300'
      }
    };
    return configs[status] || configs.PENDING;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <button
            onClick={() => navigate('/customer/orders')}
            className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-pink-600 transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = payment ? getPaymentStatusConfig(payment.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/customer/orders')}
            className="text-pink-500 font-semibold mb-2 hover:underline"
          >
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600">Order {order.nomorOrder}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {payment && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Payment Status</h2>
                  {payment.status === 'PENDING' && (
                    <button
                      onClick={checkPaymentStatus}
                      className="text-sm text-pink-500 font-semibold hover:underline"
                    >
                      Refresh Status
                    </button>
                  )}
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${statusConfig.color} mb-4`}>
                  <StatusIcon className="w-6 h-6" />
                  <div className="flex-1">
                    <div className="font-bold">{statusConfig.label}</div>
                    <div className="text-sm">Transaction ID: {payment.transactionId}</div>
                  </div>
                </div>

                {payment.status === 'PENDING' && (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-yellow-800 mb-1">
                            Complete payment before it expires
                          </div>
                          <div className="text-sm text-yellow-700">
                            Expires in: <span className="font-bold">
                              {getTimeRemaining(payment.kadaluarsaPada)}
                            </span>
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            {formatDateTime(payment.kadaluarsaPada)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {payment.urlPembayaran && (
                      <a
                        href={payment.urlPembayaran}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition"
                      >
                        <CreditCard className="w-5 h-5" />
                        Open Payment Page
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </>
                )}

                {payment.status === 'SETTLEMENT' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="font-semibold text-green-800">Payment Confirmed!</div>
                        <div className="text-sm text-green-700">
                          Paid at: {formatDateTime(payment.waktuPenyelesaian)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(payment.status === 'EXPIRE' || payment.status === 'CANCEL' || payment.status === 'DENY') && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <div className="font-semibold text-red-800">Payment {payment.status.toLowerCase()}</div>
                    </div>
                    <button
                      onClick={() => setPayment(null)}
                      className="w-full bg-red-500 text-white py-2 rounded-xl font-bold hover:bg-red-600 transition"
                    >
                      Create New Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {!payment && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Select Payment Method</h2>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setSelectedMethod(method.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedMethod === method.value
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{method.icon}</span>
                        <span className="font-bold text-gray-900">{method.label}</span>
                      </div>
                      <div className="text-xs text-gray-600">{method.description}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={createPayment}
                  disabled={creating}
                  className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {creating ? 'Creating Payment...' : 'Create Payment'}
                </button>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  You will be redirected to Midtrans payment page
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-pink-500" />
                Order Items
              </h3>
              
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <img
                      src={item.gambarUrl}
                      alt={item.namaProduk}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=No+Image'}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">{item.namaProduk}</h4>
                      <p className="text-xs text-gray-600">
                        {item.ukuranVariant} • {item.warnaVariant}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.kuantitas}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-600 text-sm">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">{formatPrice(order.ongkosKirim)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-pink-600 text-xl">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700">
                <div className="font-semibold mb-2">Shipping Address:</div>
                <div>{order.namaPenerima}</div>
                <div>{order.teleponPenerima}</div>
                <div className="mt-1">
                  {order.alamatBaris1}
                  {order.alamatBaris2 && `, ${order.alamatBaris2}`}
                </div>
                <div>
                  {order.kota}, {order.provinsi} {order.kodePos}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerPayment;
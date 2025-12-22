import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  BarChart2, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';

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
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

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

function OwnerDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalTransactions: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyRevenue: [],
    recentTransactions: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Ambil orders
      const ordersResponse = await api.get('/orders/admin/all');
      const orders = ordersResponse.data.orders || [];

      // Ambil payments (loop per order seperti di AdminTransactions)
      const transactionsPromises = orders.map(async (order) => {
        try {
          const paymentResponse = await api.get(`/payments/order/${order.id}`);
          const payments = paymentResponse.data.payments || [];
          const mainPayment = payments[0];
          
          if (mainPayment) {
            return {
              ...mainPayment,
              order: {
                id: order.id,
                nomorOrder: order.nomorOrder,
                namaPenerima: order.namaPenerima,
                total: order.total,
                status: order.status,
                dibuatPada: order.dibuatPada
              }
            };
          }
        } catch (err) {
          return null;
        }
      });

      const transactions = (await Promise.all(transactionsPromises)).filter(Boolean);

      // Hitung summary
      const totalRevenue = transactions
        .filter(t => t.status === 'SETTLED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'PENDING_PAYMENT' || o.status === 'PAID' || o.status === 'PROCESSING').length;
      const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
      const totalTransactions = transactions.length;

      // Monthly revenue chart data
      const monthlyData = [];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        const revenue = transactions
          .filter(t => t.status === 'SETTLED' && new Date(t.settledAt).getMonth() === date.getMonth() && new Date(t.settledAt).getFullYear() === date.getFullYear())
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        monthlyData.push({ name: monthName, revenue });
      }

      // Recent transactions (5 terbaru)
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Top products (hitung dari orders items)
      const productSales = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const key = item.namaProduk;
          productSales[key] = (productSales[key] || 0) + item.kuantitas * item.hargaSnapshot;
        });
      });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sales]) => ({ name, sales }));

      setDashboardData({
        totalRevenue,
        totalOrders,
        totalTransactions,
        pendingOrders,
        completedOrders,
        monthlyRevenue: monthlyData,
        recentTransactions,
        topProducts
      });
    } catch (err) {
      console.error('Gagal memuat data dashboard:', err);
      showNotification('error', 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20 lg:pb-0">
      {/* Notifikasi */}
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
                <BarChart2 className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Owner</h1>
                <p className="text-gray-500 text-sm lg:text-base">Laporan keuangan & performa toko</p>
              </div>
            </div>
            <button
              onClick={loadDashboardData}
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b34583] transition-all flex items-center gap-2 shadow-sm w-full lg:w-auto justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-[#cb5094] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Pendapatan</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{formatPrice(dashboardData.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-pink-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 text-[#cb5094]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Pesanan</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{dashboardData.totalOrders}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 lg:w-7 lg:h-7 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Transaksi</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{dashboardData.totalTransactions}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 lg:w-7 lg:h-7 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pesanan Pending</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{dashboardData.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pesanan Selesai</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{dashboardData.completedOrders}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 lg:w-7 lg:h-7 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-[#cb5094]" />
            Pendapatan Bulanan
          </h2>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => formatPrice(value, true)} />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#cb5094" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#cb5094]" />
            Transaksi Terbaru
          </h2>
          {dashboardData.recentTransactions.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Belum ada transaksi terbaru</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentTransactions.map((trans, idx) => {
                const statusConfig = mapStatusToConfig(trans.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                  >
                    <div className={`w-10 h-10 ${statusConfig.color} rounded-full flex items-center justify-center text-white`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{trans.order.nomorOrder}</p>
                      <p className="text-sm text-gray-600">{formatDate(trans.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#cb5094]">{formatPrice(trans.amount)}</p>
                      <p className="text-sm text-gray-500">{trans.order.namaPenerima}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-[#cb5094]" />
            Produk Terlaris
          </h2>
          {dashboardData.topProducts.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Belum ada data penjualan produk</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.topProducts.map((product, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                >
                  <div className="w-10 h-10 bg-[#cb5094] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">Penjualan: {formatPrice(product.sales)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
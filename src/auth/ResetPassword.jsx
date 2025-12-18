import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, User, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:5000/api';

function Notification({ type, message, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => handleClose(), 4000);
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

export default function ResetPassword() {
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token');
    if (queryToken) return queryToken;
    
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  const token = getTokenFromUrl();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!token || token === 'reset-password') {
      showNotification("error", "Token tidak ditemukan di URL. Silakan gunakan link dari email");
      return;
    }

    if (!password || !confirmPassword) {
      showNotification('error', 'Semua field wajib diisi');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('error', 'Password tidak cocok. Silakan periksa kembali');
      return;
    }

    if (password.length < 8) {
      showNotification('warning', 'Password minimal 8 karakter untuk keamanan akun Anda');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordBaru: password })
      });

      const data = await res.json();

      if (res.ok) {
        showNotification("success", "Password berhasil direset! 🎉 Silakan login dengan password baru");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        showNotification("error", data.message || "Token tidak valid atau sudah kadaluarsa. Silakan minta link baru");
      }
    } catch (err) {
      console.error('Error:', err);
      showNotification("error", "Gagal terhubung ke server. Pastikan backend berjalan di " + BACKEND_URL);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative overflow-hidden flex items-center justify-center">
      {notification && (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Background Blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#e570b3] to-[#cb5094] rounded-full blur-3xl opacity-20 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#cb5094]/20 to-[#e570b3]/20 rounded-full blur-3xl opacity-10 animate-spin-slow"></div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        window.scrollY > 20 ? 'bg-white/80 backdrop-blur-xl shadow-2xl py-2' : 'bg-white/70 backdrop-blur-md py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className={`relative transition-all duration-700 ${isLoaded ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-[#cb5094] via-[#e570b3] to-[#cb5094] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 animate-pulse">
                  <img src="/logo.png" alt="Medina Stuff Logo" className="w-9 h-9 object-contain relative z-10"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} />
                  <span className="text-2xl font-serif text-white italic font-bold relative z-10 hidden">MS</span>
                </div>
              </div>
              <div className={`hidden sm:block transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <div className="text-xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                  MyMedina
                </div>
                <div className="text-xs text-gray-500 font-medium">by Medina Stuff</div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="relative p-3 hover:bg-[#fffbf8] rounded-full transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <User className="relative w-6 h-6 text-[#cb5094] group-hover:scale-110 transition-transform" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute top-16 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                  <div className="py-2">
                    <Link
                      to="/login"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="block px-6 py-3 text-gray-800 font-medium hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#e570b3] hover:text-white transition-all duration-300"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="block px-6 py-3 text-gray-800 font-medium hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#e570b3] hover:text-white transition-all duration-300 border-t border-gray-100"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Form Reset Password */}
      <div className="relative z-10 w-full max-w-md px-4 pt-32 pb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 sm:p-10 transition-all duration-1000"
          style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#cb5094] mb-2">Reset Password</h1>
            <p className="text-gray-600 text-sm font-medium">Masukkan password baru Anda</p>
            {(!token || token === 'reset-password') && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-xs sm:text-sm">
                  ⚠️ Token tidak ditemukan! Gunakan link dari email
                </p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="relative">
              <div className="flex items-center bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-300 focus-within:border-[#cb5094] focus-within:ring-4 focus-within:ring-pink-100">
                <Lock className="w-5 h-5 text-[#cb5094] mr-3" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password Baru (min. 8 karakter)" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 outline-none text-gray-700 placeholder:text-gray-400 font-medium" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:bg-pink-50 rounded-lg p-1.5 transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-[#cb5094]" /> : <Eye className="w-5 h-5 text-[#cb5094]" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-300 focus-within:border-[#cb5094] focus-within:ring-4 focus-within:ring-pink-100">
                <Lock className="w-5 h-5 text-[#cb5094] mr-3" />
                <input 
                  type={showConfirm ? "text" : "password"} 
                  placeholder="Konfirmasi Password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 outline-none text-gray-700 placeholder:text-gray-400 font-medium" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="hover:bg-pink-50 rounded-lg p-1.5 transition-all"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5 text-[#cb5094]" /> : <Eye className="w-5 h-5 text-[#cb5094]" />}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-gray-600 text-xs sm:text-sm">
                  <span>Kekuatan Password:</span>
                  <span className="font-semibold">
                    {password.length < 8 ? 'Lemah' : password.length < 12 ? 'Sedang' : 'Kuat'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      password.length < 8 
                        ? 'w-1/3 bg-red-400' 
                        : password.length < 12 
                        ? 'w-2/3 bg-yellow-400' 
                        : 'w-full bg-green-400'
                    }`}
                  ></div>
                </div>
              </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={isLoading || !token || token === 'reset-password'}
              className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] hover:from-[#b04580] hover:to-[#d460a2] text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? 'Menyimpan...' : 'SIMPAN PASSWORD BARU'}
            </button>
          </div>

          <p className="text-center text-gray-600 mt-6 text-sm font-medium">
            Ingat password Anda? <a href="/login" className="text-[#cb5094] font-bold hover:underline transition-all">Kembali ke Login</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes progress { from { width: 100% } to { width: 0% } }
        .animate-progress { animation: progress 4s linear forwards; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 1s; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
    </div>
  );
}
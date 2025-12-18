import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowRight, User, X, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function VerifyEmail() {
  const userId = new URLSearchParams(window.location.search).get('userId') || 'demo-user-id';
  const userEmail = new URLSearchParams(window.location.search).get('email') || 'user@example.com';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('');
    
    while (newCode.length < 6) newCode.push('');
    
    setCode(newCode);
    
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      showNotification('error', 'Masukkan kode verifikasi 6 digit');
      return;
    }

    setIsVerifying(true);

    try {
      console.log('Verifying with:', { userId, verificationCode });
      
      const response = await fetch(
        `http://localhost:5000/api/auth/verifikasi-email/${userId}/${verificationCode}`,
        { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        showNotification('success', 'Email berhasil diverifikasi! Mengarahkan ke halaman login...');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const errorMessage = data.message || data.error || 'Kode verifikasi salah atau sudah kadaluarsa';
        
        if (response.status === 404) {
          showNotification('error', 'User tidak ditemukan. Silakan daftar ulang');
        } else if (response.status === 400) {
          showNotification('error', errorMessage);
        } else if (response.status === 500) {
          showNotification('error', 'Terjadi kesalahan server. Silakan coba lagi');
        } else {
          showNotification('error', errorMessage);
        }
        
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Verification error:', err);
      
      if (err.message === 'Failed to fetch') {
        showNotification('error', 'Gagal terhubung ke server. Pastikan backend berjalan di http://localhost:5000');
      } else {
        showNotification('error', 'Terjadi kesalahan: ' + err.message);
      }
    } finally {
      setIsVerifying(false);
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

      {/* Form Verifikasi */}
      <div className="relative z-10 w-full max-w-md px-4 pt-32 pb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 sm:p-10 transition-all duration-1000"
          style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}>
          
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center mb-4 shadow-xl">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#cb5094] mb-2">Verifikasi Email</h1>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Masukkan kode 6 digit yang telah dikirim ke
            </p>
            <p className="text-[#cb5094] font-semibold text-sm">
              {userEmail}
            </p>
          </div>

          <div className="flex justify-center gap-2 sm:gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white border-2 border-gray-100 text-[#cb5094] rounded-2xl shadow-sm focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all duration-300 hover:shadow-md hover:border-pink-200"
                disabled={isVerifying}
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying || code.join('').length !== 6}
            className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] hover:from-[#b04580] hover:to-[#d460a2] text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] mb-6"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                Verifikasi
                <ArrowRight className="w-5 h-5 ml-2" />
              </span>
            )}
          </button>

          <p className="text-center text-gray-600 text-sm font-medium">
            Sudah punya akun? <a href="/login" className="text-[#cb5094] font-bold hover:underline transition-all">Login sekarang</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 1s; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowRight, Menu, X, Mail } from 'lucide-react';

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
    success: { icon: CheckCircle, bgColor: 'from-green-400 to-emerald-500' },
    error: { icon: XCircle, bgColor: 'from-red-400 to-rose-500' },
  };

  const config = configs[type] || configs.success;
  const Icon = config.icon;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${isExiting ? 'translate-y-[-150%] opacity-0' : 'translate-y-0 opacity-100'}`}>
      <div className={`bg-gradient-to-r ${config.bgColor} text-white rounded-2xl shadow-2xl p-4 min-w-[320px] max-w-md border-2 border-white/30`}>
        <div className="flex items-start space-x-3">
          <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium flex-1">{message}</p>
          <button onClick={handleClose} className="hover:bg-white/20 rounded-full p-1 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress"></div>
        </div>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-pink-50 relative overflow-hidden flex items-center justify-center">
      {notification && (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -left-40 top-0 w-[600px] h-[600px] bg-pink-300/40 rounded-full blur-3xl transition-all duration-1000"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
          }}
        ></div>
        
        <div 
          className="absolute -right-40 bottom-0 w-[600px] h-[600px] bg-pink-200/40 rounded-full blur-3xl transition-all duration-1000 delay-200"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
          }}
        ></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <a href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                <img 
                  src="/logo.png" 
                  alt="Medina Stuff Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <span className="text-xl sm:text-2xl font-serif text-white italic font-bold hidden">MS</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-bold text-gray-800">MyMedina</div>
                  <div className="text-xs text-gray-500">by Medina Stuff</div>
              </div>
            </a>

            <div className="hidden lg:flex items-center space-x-4">
              <a href="/login" className="bg-[#cb5094] text-white px-6 py-2.5 rounded-full font-semibold text-sm tracking-wide hover:bg-[#b04580] hover:shadow-lg transition-all duration-300">
                LOGIN
              </a>
              <a href="/signup" className="text-[#cb5094] font-semibold text-sm tracking-wide hover:underline transition-all">
                SIGN UP
              </a>
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-pink-50 rounded-lg transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
            </button>
          </div>

          <div 
            className={`lg:hidden overflow-hidden transition-all duration-500 ${
              isMenuOpen ? 'max-h-64 opacity-100 pb-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-1">
              <a href="/login" className="block py-3 px-4 text-[#cb5094] font-semibold bg-pink-50 rounded-lg transition-all">
                LOGIN
              </a>
              <a href="/signup" className="block py-3 px-4 text-gray-700 hover:text-[#cb5094] hover:bg-pink-50 rounded-lg font-semibold text-sm transition-all">
                SIGN UP
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-md px-4 pt-24 pb-8">
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
        @keyframes progress { from { width: 100% } to { width: 0% } }
        .animate-progress { animation: progress 4s linear forwards; }
        
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
}
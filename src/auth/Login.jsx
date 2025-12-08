import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Menu, X, CheckCircle, XCircle } from 'lucide-react';

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
    success: { icon: CheckCircle, bgColor: 'from-green-400 to-emerald-500' },
    error: { icon: XCircle, bgColor: 'from-red-400 to-rose-500' }
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

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification('error', 'Email dan password wajib diisi!');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Login attempt:', email);

      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password
        })
      });

      const data = await res.json();
      console.log('Response:', data);

      if (res.ok) {
        const token = data.accessToken || data.token;
        const user = data.user || data.data?.user || data;
        const role = (user.role || 'CUSTOMER').toUpperCase();

        if (!token) {
          showNotification('error', 'Token tidak ditemukan!');
          return;
        }

        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify({ ...user, role }));

        showNotification('success', 'Login berhasil! Mengarahkan...');

        setTimeout(() => {
          if (role === 'ADMIN') {
            window.location.href = '/admin/dashboard';
          } else if (role === 'OWNER') {
            window.location.href = '/owner/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        }, 1200);
      } else {
        showNotification('error', data.message || 'Email atau password salah');
      }
    } catch (err) {
      console.error('Login error:', err);
      showNotification('error', 'Gagal terhubung ke server. Pastikan backend jalan!');
    } finally {
      setIsLoading(false);
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
                <div className="text-sm sm:text-base text-gray-600 font-medium italic tracking-wide">
                  Medina Stuff
                </div>
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
            <h1 className="text-4xl sm:text-5xl font-bold text-[#cb5094] mb-2">Welcome Back!</h1>
            <p className="text-gray-600 text-sm font-medium">Masuk untuk melanjutkan</p>
          </div>

          <div className="space-y-5">
            <div className="relative">
              <div className="flex items-center bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-300 focus-within:border-[#cb5094] focus-within:ring-4 focus-within:ring-pink-100">
                <Mail className="w-5 h-5 text-[#cb5094] mr-3" />
                <input 
                  type="email" 
                  placeholder="Alamat Email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder:text-gray-400 font-medium" 
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-300 focus-within:border-[#cb5094] focus-within:ring-4 focus-within:ring-pink-100">
                <Lock className="w-5 h-5 text-[#cb5094] mr-3" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Kata Sandi" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
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

            <a href="/forgot-password" className="block text-right text-[#cb5094] text-sm font-semibold hover:underline transition-all">
              Lupa Kata Sandi?
            </a>

            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] hover:from-[#b04580] hover:to-[#d460a2] text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? 'Memproses...' : 'MASUK'}
            </button>
          </div>

          <p className="text-center text-gray-600 mt-6 text-sm font-medium">
            Belum punya akun? <a href="/signup" className="text-[#cb5094] font-bold hover:underline transition-all">Daftar sekarang</a>
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

export default Login;
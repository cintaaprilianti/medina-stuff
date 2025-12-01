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
    <div className={`fixed top-24 right-4 z-[100] transition-all duration-300 ${isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}>
      <div className={`bg-gradient-to-r ${config.bgColor} text-white rounded-2xl shadow-2xl p-4 min-w-[320px] border-2 border-white/30`}>
        <div className="flex items-start space-x-3">
          <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium flex-1">{message}</p>
          <button onClick={handleClose} className="hover:bg-white/20 rounded-full p-1">
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
      showNotification('error', 'Gagal ter27 ke server. Pastikan backend jalan!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf8] relative overflow-hidden flex items-center justify-center">
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
          className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-tr-full transition-all duration-1000"
          style={{
            opacity: isLoaded ? 0.95 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
          }}
        ></div>
        
        <div 
          className="absolute right-0 top-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#cb5094] to-[#e570b3] rounded-bl-full transition-all duration-1000 delay-200"
          style={{
            opacity: isLoaded ? 0.85 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
          }}
        ></div>

        <div className="absolute top-[20%] left-[15%] w-16 h-16 rounded-full bg-[#cb5094]/20 animate-float"></div>
        <div className="absolute bottom-[30%] right-[20%] w-12 h-12 rounded-full bg-[#cb5094]/15 animate-float-delayed"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm shadow-sm">
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
              <a href="/login" className="bg-[#cb5094] text-white px-6 py-2 rounded-full font-bold text-sm tracking-wide hover:bg-[#b04580] transition-all">
                LOGIN
              </a>
              <a href="/signup" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all">
                SIGN UP
              </a>
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#fffbf8] rounded-lg transition-all duration-300"
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
              <a href="/login" className="block py-3 px-4 text-[#cb5094] font-semibold bg-[#fffbf8] rounded-lg transition-all">
                LOGIN
              </a>
              <a href="/signup" className="block py-3 px-4 text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8] rounded-lg font-bold text-sm transition-all">
                SIGN UP
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-md px-4 pt-24 pb-8">
        <div className="bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-3xl shadow-2xl p-8 transition-all duration-1000"
          style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-serif text-white mb-2">Welcome Back!</h1>
            <p className="text-white/90">Login to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center bg-white rounded-full px-5 py-4 shadow-lg">
              <Mail className="w-5 h-5 text-[#cb5094] mr-3" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                className="flex-1 outline-none text-gray-700" required />
            </div>

            <div className="flex items-center bg-white rounded-full px-5 py-4 shadow-lg">
              <Lock className="w-5 h-5 text-[#cb5094] mr-3" />
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                className="flex-1 outline-none text-gray-700" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-5 h-5 text-[#cb5094]" /> : <Eye className="w-5 h-5 text-[#cb5094]" />}
              </button>
            </div>

            <a href="/forgot-password" className="block text-right text-white text-sm hover:underline">
              Forgot Password?
            </a>

            <button type="submit" disabled={isLoading}
              className="w-full bg-[#7a2c5e] hover:bg-[#5d1f46] text-white font-bold py-4 rounded-full transition-all disabled:opacity-70">
              {isLoading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          <p className="text-center text-white mt-6 text-sm">
            Belum punya akun? <a href="/signup" className="font-bold underline">Sign up</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes progress { from { width: 100% } to { width: 0% } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-progress { animation: progress 4s linear forwards; }
      `}</style>
    </div>
  );
}

export default Login
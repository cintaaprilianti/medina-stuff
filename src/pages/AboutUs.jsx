import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Heart, Sparkles, Users, Award, Globe } from 'lucide-react';

function AboutUs() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffbf8]">
      {/* Navbar — SAMA PERSIS dengan Home */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3' : 'bg-white/90 backdrop-blur-sm py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center space-x-3 group">
              <div className={`relative transition-all duration-700 ${isLoaded ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 relative overflow-hidden">
                  <img src="/logo.png" alt="Medina Stuff Logo" className="w-8 h-8 object-contain relative z-10"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} />
                  <span className="text-2xl font-serif text-white italic font-bold relative z-10 hidden">MS</span>
                </div>
              </div>
              <div className={`hidden sm:block transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <div className="text-base text-gray-600 font-medium italic tracking-wide">Medina Stuff</div>
              </div>
            </a>

            <div className="hidden lg:flex items-center space-x-1">
              {['HOME', 'ABOUT US', 'CONTACT'].map((item, i) => (
                <a key={item} href={`#${item.toLowerCase().replace(' ', '')}`}
                  className={`px-5 py-2 font-bold text-sm tracking-wide rounded-lg transition-all duration-300 transform hover:scale-105 ${i === 1 ? 'text-[#cb5094] bg-[#fffbf8]' : 'text-gray-600 hover:text-[#cb5094] hover:bg-[#fffbf8]'}`}>
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/login" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105">LOGIN</Link>
                <Link to="/signup" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105">SIGN UP</Link>
              </div>
              <button className="p-2 hover:bg-[#fffbf8] rounded-full transition-all duration-300 group">
                <Heart className="w-6 h-6 text-[#cb5094] group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 hover:bg-[#fffbf8] rounded-lg transition-all duration-300">
                {isMenuOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
              </button>
            </div>
          </div>

          <div className={`lg:hidden overflow-hidden transition-all duration-500 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-4 space-y-1">
              <a href="/" className="block py-3 px-4 rounded-lg text-[#cb5094] font-semibold bg-[#fffbf8]">HOME</a>
              <a href="/#aboutus" className="block py-3 px-4 rounded-lg bg-[#fffbf8] text-[#cb5094] font-semibold">ABOUT US</a>
              <a href="/#contact" className="block py-3 px-4 rounded-lg hover:bg-[#fffbf8] hover:text-[#cb5094]">CONTACT</a>
              <Link to="/login" className="block py-3 px-4 rounded-lg hover:bg-[#fffbf8] hover:text-[#cb5094]">LOGIN</Link>
              <Link to="/signup" className="block py-3 px-4 rounded-lg hover:bg-[#fffbf8] hover:text-[#cb5094]">SIGN UP</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero About */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-gradient-to-br from-[#fffbf8] via-white to-[#fffbf8]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#cb5094]/10 animate-float"></div>
          <div className="absolute bottom-32 right-20 w-24 h-24 rounded-full bg-[#e570b3]/10 animate-float-delayed"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h1 className="text-5xl sm:text-7xl font-serif text-[#cb5094] mb-6">
              Tentang <span className="relative">Medina Stuff
                <span className="absolute -bottom-3 left-0 w-full h-3 bg-[#cb5094]/20 rounded-full"></span>
              </span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Kami hadir untuk merayakan keindahan wanita muslimah modern — yang ingin tampil anggun, percaya diri, dan tetap menjaga nilai kesucian.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mb-20">
            {[
              { icon: Sparkles, title: "Visi Kami", desc: "Menjadi brand modest fashion terdepan di Indonesia yang menginspirasi jutaan muslimah untuk mencintai diri mereka apa adanya." },
              { icon: Heart, title: "Misi Kami", desc: "Menghadirkan pakaian berkualitas tinggi dengan desain terkini, nyaman dipakai, dan tetap sesuai syariat." },
              { icon: Users, title: "Nilai Kami", desc: "Keindahan, Kesopanan, Kebersamaan, Kualitas, dan Keberkahan dalam setiap jahitan." }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <img src="/team.png" alt="Tim Medina Stuff" className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl"
              onError={(e) => e.target.src = "https://via.placeholder.com/1200x600/fbfbf8/cb5094?text=Tim+Medina+Stuff"} />
          </div>
        </div>
      </section>

      {/* Footer — SAMA PERSIS dengan Home */}
      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} />
                  <span className="text-2xl font-serif text-white italic font-bold hidden">MS</span>
                </div>
                <span className="text-base text-gray-600 font-medium italic tracking-wide">Medina Stuff</span>
              </div>
              <p className="text-gray-600 text-sm">Empowering modest fashion with elegance, style, and dignity for the modern Muslimah.</p>
            </div>
            {/* ... (Shop, Support, Follow Us — sama persis seperti Home) */}
          </div>
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 text-sm">© 2025 Medina Stuff. All rights reserved. Made with <Heart className="inline-block w-4 h-4 text-red-500 animate-pulse mx-1" /> for the Muslimah community.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes float-delayed { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay:1s; }
      `}</style>
    </div>
  );
}

export default AboutUs;
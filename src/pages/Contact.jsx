import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, MapPin, Phone, Mail, Instagram, MessageCircle, Send } from 'lucide-react';

function Contact() {
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
      {/* Navbar — SAMA PERSIS */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3' : 'bg-white/90 backdrop-blur-sm py-4'}`}>
        {/* ... (copy paste navbar dari AboutUs atau Home, hanya ubah active menu jadi CONTACT) */}
        {/* Active menu: CONTACT jadi bg-[#fffbf8] dan text-[#cb5094] */}
      </nav>

      {/* Hero Contact */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 w-40 h-40 rounded-full bg-[#cb5094]/10 animate-float"></div>
          <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-[#e570b3]/10 animate-float-delayed"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16">
          {/* Left - Info */}
          <div className="space-y-12">
            <div>
              <h1 className="text-5xl sm:text-7xl font-serif text-[#cb5094] mb-6">
                Hubungi Kami
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                Kami selalu siap mendengar cerita, saran, atau pertanyaan dari kamu, sahabat Medina Stuff.
              </p>
            </div>

            <div className="space-y-8">
              {[
                { icon: Phone, text: "+62 812-3456-7890", label: "Telepon / WhatsApp" },
                { icon: Mail, text: "hello@medinastuff.id", label: "Email" },
                { icon: MapPin, text: "Jakarta, Indonesia", label: "Alamat" }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center space-x-6 group">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="text-lg font-semibold text-gray-800">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-6">
              <a href="https://instagram.com/medinastuff" className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl hover:bg-gradient-to-br hover:from-[#cb5094] hover:to-[#e570b3] transition-all duration-300 group">
                <Instagram className="w-7 h-7 text-[#cb5094] group-hover:text-white" />
              </a>
              <a href="https://wa.me/6281234567890" className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 transition-all duration-300 group">
                <MessageCircle className="w-7 h-7 text-[#cb5094] group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Kirim Pesan</h2>
            <form className="space-y-6">
              <input type="text" placeholder="Nama Lengkap" className="w-full px-6 py-4 rounded-full border border-gray-200 focus:border-[#cb5094] focus:outline-none transition-all" />
              <input type="email" placeholder="Email" className="w-full px-6 py-4 rounded-full border border-gray-200 focus:border-[#cb5094] focus:outline-none transition-all" />
              <textarea rows="6" placeholder="Pesan kamu..." className="w-full px-6 py-4 rounded-3xl border border-gray-200 focus:border-[#cb5094] focus:outline-none transition-all resize-none"></textarea>
              <button type="submit" className="w-full bg-gradient-to-br from-[#cb5094] to-[#e570b3] text-white py-5 rounded-full font-bold text-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
                Kirim Pesan <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#cb5094] to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="Medina Stuff Logo" className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} />
                  <span className="text-2xl font-serif text-white italic font-bold hidden">MS</span>
                </div>
                <span className="text-base text-gray-600 font-medium italic tracking-wide" style={{ fontFamily: 'sans-serif' }}>
                  Medina Stuff
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                Empowering modest fashion with elegance, style, and dignity for the modern Muslimah.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Shop
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <ul className="space-y-3">
                {['New Arrivals', 'Hijabs', 'Dresses', 'Tunics', 'Sale'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-[#cb5094] transition-all text-sm transform hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Support
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <ul className="space-y-3">
                {['Contact Us', 'Shipping Info', 'Returns', 'Size Guide', 'FAQ'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-[#cb5094] transition-all text-sm transform hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Us - Instagram, WhatsApp, Shopee */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Follow Us
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <div className="flex gap-5">
                <a href="https://instagram.com/medinastuff" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-[#fffbf8] to-white rounded-full flex items-center justify-center hover:from-[#cb5094] hover:to-[#e570b3] hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100">
                  <Instagram className="w-6 h-6 text-[#cb5094] hover:text-white" />
                </a>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-[#fffbf8] to-white rounded-full flex items-center justify-center hover:from-[#25d366] hover:to-[#128c7e] hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100">
                  <MessageCircle className="w-6 h-6 text-[#cb5094] hover:text-white" />
                </a>
                <a href="https://shopee.co.id/medinastuff" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-[#fffbf8] to-white rounded-full flex items-center justify-center hover:from-[#ee4d2d] hover:to-[#c1351f] hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100">
                  <ShoppingBag className="w-6 h-6 text-[#cb5094] hover:text-white" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Medina Stuff. All rights reserved. Made with <Heart className="inline-block w-4 h-4 text-red-500 animate-pulse mx-1" /> for the Muslimah community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Contact;
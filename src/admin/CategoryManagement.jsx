import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FolderTree, X, Tag, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { categoryAPI } from '../utils/api';

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
    success: { 
      bgColor: 'bg-green-500', 
      shadowColor: 'shadow-green-500/50' 
    },
    error: { 
      bgColor: 'bg-red-500', 
      shadowColor: 'shadow-red-500/50' 
    }
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

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    slug: '',
    deskripsi: '',
    aktif: true
  });

  // Notifikasi
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll(true);
      const data = Array.isArray(res) ? res : res.data || res || [];
      setCategories(data);
    } catch (error) {
      console.error(error);
      showNotification('error', 'Gagal memuat kategori');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNamaChange = (e) => {
    const nama = e.target.value;
    const slug = nama
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData({ ...formData, nama, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.slug.trim()) {
      showNotification('error', 'Nama dan slug wajib diisi!');
      return;
    }

    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, formData);
        showNotification('success', 'Kategori berhasil diupdate!');
      } else {
        await categoryAPI.create(formData);
        showNotification('success', 'Kategori berhasil ditambahkan!');
      }
      
      handleCancelForm();
      fetchCategories(); 
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan';
      showNotification('error', 'Gagal: ' + msg);
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      nama: cat.nama,
      slug: cat.slug,
      deskripsi: cat.deskripsi || '',
      aktif: cat.aktif
    });
    setShowForm(true);
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin hapus kategori "${nama}"?`)) return;
    try {
      await categoryAPI.delete(id);
      showNotification('success', 'Kategori berhasil dihapus!');
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan';
      showNotification('error', 'Gagal hapus: ' + msg);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ nama: '', slug: '', deskripsi: '', aktif: true });
  };

  const filtered = categories.filter(cat =>
    cat.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = categories.filter(c => c.aktif).length;
  const inactiveCount = categories.length - activeCount;

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
                <FolderTree className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Kelola Kategori</h1>
                <p className="text-gray-500 text-sm lg:text-base">Atur kategori produk di toko Anda</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b34583] transition-all flex items-center gap-2 shadow-sm w-full lg:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Tambah Kategori
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-[#cb5094] hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Kategori</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{categories.length}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-pink-50 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 lg:w-7 lg:h-7 text-[#cb5094]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Kategori Aktif</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{activeCount}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 lg:w-7 lg:h-7 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-gray-400 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Kategori Nonaktif</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">{inactiveCount}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 lg:w-7 lg:h-7 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-5 border border-pink-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kategori berdasarkan nama atau slug..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4 lg:space-y-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat kategori...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-8 text-center">
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderTree className="w-10 h-10 text-[#cb5094]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {searchQuery ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Coba kata kunci lain atau hapus filter pencarian' 
                  : 'Mulai dengan menambahkan kategori pertama'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b34583] transition-all shadow-md"
                >
                  Tambah Kategori Pertama
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filtered.map(cat => (
                  <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{cat.nama}</h3>
                        <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded mt-1 inline-block">{cat.slug}</code>
                      </div>
                      {cat.aktif ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                          <XCircle className="w-3 h-3" />
                          Nonaktif
                        </span>
                      )}
                    </div>
                    {cat.deskripsi && (
                      <p className="text-sm text-gray-600 mb-4">{cat.deskripsi}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="flex-1 py-2.5 bg-[#cb5094] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.nama)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Grid View */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(cat => (
                  <div 
                    key={cat.id} 
                    className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-[#cb5094]/30 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#cb5094] transition-colors">
                          {cat.nama}
                        </h3>
                        <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded font-mono border border-gray-200">
                          {cat.slug}
                        </code>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        {cat.aktif ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold border border-gray-200">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>

                    {cat.deskripsi && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {cat.deskripsi}
                      </p>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => handleEdit(cat)} 
                        className="flex-1 flex items-center justify-center gap-2 bg-[#cb5094] text-white py-2 rounded-lg font-semibold hover:bg-[#b34583] transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id, cat.nama)} 
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-2xl p-5 text-center border border-pink-100 shadow-sm">
            <p className="text-gray-600">
              Menampilkan <span className="font-bold text-[#cb5094]">{filtered.length}</span> dari{' '}
              <span className="font-bold text-[#cb5094]">{categories.length}</span> kategori
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#cb5094] px-6 py-5 flex justify-between items-center rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h2>
                <p className="text-white/90 text-sm mt-1">
                  {editingCategory ? 'Perbarui informasi kategori' : 'Buat kategori produk baru'}
                </p>
              </div>
              <button 
                onClick={handleCancelForm} 
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#cb5094]" />
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={handleNamaChange}
                  placeholder="Contoh: Gamis, Hijab, Mukena"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Nama kategori akan otomatis menghasilkan slug</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug (URL) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="gamis-syari"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                    /kategori/{formData.slug || '...'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan tentang kategori ini..."
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl border-2 border-pink-100">
                <input
                  type="checkbox"
                  id="aktif-checkbox"
                  checked={formData.aktif}
                  onChange={e => setFormData({ ...formData, aktif: e.target.checked })}
                  className="w-5 h-5 text-[#cb5094] rounded focus:ring-2 focus:ring-[#cb5094]"
                />
                <label htmlFor="aktif-checkbox" className="flex-1 cursor-pointer">
                  <span className="font-semibold text-gray-800">Status Aktif</span>
                  <p className="text-xs text-gray-500">Kategori aktif akan tampil di toko</p>
                </label>
                {formData.aktif ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-[#cb5094] text-white py-4 rounded-xl font-semibold hover:bg-[#b34583] transition-all shadow-md"
                >
                  {editingCategory ? 'Update Kategori' : 'Simpan Kategori'}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelForm} 
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;
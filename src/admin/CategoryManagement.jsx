import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FolderTree, Check, X } from 'lucide-react';
import { categoryAPI } from '../utils/api';

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
      alert('Gagal memuat kategori');
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
      alert('Nama dan slug wajib diisi!');
      return;
    }

    try {
      editingCategory
        ? await categoryAPI.update(editingCategory.id, formData)
        : await categoryAPI.create(formData);

      alert(editingCategory ? 'Kategori berhasil diupdate!' : 'Kategori berhasil ditambahkan!');
      handleCancelForm();
      fetchCategories(); 
    } catch (err) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
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
      alert('Kategori dihapus!');
      fetchCategories();
    } catch (err) {
      alert('Gagal hapus: ' + (err.response?.data?.message || err.message));
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Kategori</h1>
          <p className="text-gray-600">Atur kategori produk Medina Stuff</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Tambah Kategori
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari kategori..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
        />
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#cb5094]/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {editingCategory ? 'Edit' : 'Tambah'} Kategori
            </h2>
            <button onClick={handleCancelForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-bold mb-2">Nama Kategori *</label>
              <input
                type="text"
                value={formData.nama}
                onChange={handleNamaChange}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#cb5094]"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Deskripsi</label>
              <textarea
                value={formData.deskripsi}
                onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border rounded-xl"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.aktif}
                onChange={e => setFormData({ ...formData, aktif: e.target.checked })}
                className="w-5 h-5 text-[#cb5094] rounded"
              />
              <span>Kategori aktif</span>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold">
                {editingCategory ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={handleCancelForm} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar Kategori */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 border-4 border-[#cb5094] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FolderTree className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-600">
              {searchQuery ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-700">Nama</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700">Slug</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 text-center font-bold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cat => (
                <tr key={cat.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{cat.nama}</td>
                  <td className="px-6 py-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{cat.slug}</code>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {cat.aktif ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Aktif</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:bg-blue-50 p-2 rounded mx-1">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.nama)} className="text-red-600 hover:bg-red-50 p-2 rounded mx-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default CategoryManagement;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Search, PackageSearch, Eye, X
} from 'lucide-react';
import { productAPI, categoryAPI } from '../utils/api';
import { formatPrice, getStatusLabel, getStatusColor, PRODUCT_STATUS } from '../utils/formatPrice';
import ImageUpload from '../components/ImageUpload';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [formData, setFormData] = useState({
    categoryId: '',
    nama: '',
    slug: '',
    deskripsi: '',
    hargaDasar: '',
    berat: '',
    status: 'READY',
    aktif: true,
    gambarUrl: ''
  });

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [currentPage, filterCategory, filterStatus, searchQuery]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        categoryId: filterCategory || undefined,
        status: filterStatus || undefined,
        active: undefined 
      };

      const response = await productAPI.getAll(params);
      setProducts(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalProducts(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Gagal memuat produk: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll(false); 
      setCategories(response.data || []); 
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); 
    }
  };

  // Auto-generate slug from nama
  const handleNamaChange = (e) => {
    const nama = e.target.value;
    const slug = nama
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setFormData({ ...formData, nama, slug });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.categoryId || !formData.nama || !formData.hargaDasar) {
      alert('Kategori, nama, dan harga wajib diisi');
      return;
    }

    const payload = {
      ...formData,
      hargaDasar: parseInt(formData.hargaDasar),
      berat: parseInt(formData.berat) || 0
    };

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
        alert('Produk berhasil diupdate!');
      } else {
        await productAPI.create(payload);
        alert('Produk berhasil dibuat!');
      }
      
      handleCancelForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      categoryId: product.categoryId,
      nama: product.nama,
      slug: product.slug,
      deskripsi: product.deskripsi || '',
      hargaDasar: product.hargaDasar.toString(),
      berat: product.berat?.toString() || '0',
      status: product.status,
      aktif: product.aktif,
      gambarUrl: product.gambarUrl || ''
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus produk "${nama}"?`)) return;

    try {
      await productAPI.delete(id);
      alert('Produk berhasil dihapus!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Gagal menghapus produk: ' + (error.message || 'Unknown error'));
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      categoryId: '',
      nama: '',
      slug: '',
      deskripsi: '',
      hargaDasar: '',
      berat: '',
      status: 'READY',
      aktif: true,
      gambarUrl: ''
    });
  };

  // Handle image uploaded
  const handleImageUploaded = (url) => {
    setFormData({ ...formData, gambarUrl: url });
  };

  // View variants
  const handleViewVariants = (productId) => {
    navigate(`/admin/products/${productId}/variants`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Produk</h1>
          <p className="text-gray-600 mt-1">Atur produk di toko Anda</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Produk
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
        >
          <option value="">Semua Kategori</option>
          {Array.isArray(categories) && categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nama}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
        >
          <option value="">Semua Status</option>
          <option value="READY">Ready Stock</option>
          <option value="PO">Pre Order</option>
          <option value="DISCONTINUED">Discontinued</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#cb5094]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            <button onClick={handleCancelForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {Array.isArray(categories) && categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nama}</option>
                  ))}
                </select>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={handleNamaChange}
                  placeholder="Gamis Syari Premium"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] font-mono text-sm"
                />
              </div>

              {/* Harga */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Harga Dasar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.hargaDasar}
                  onChange={(e) => setFormData({ ...formData, hargaDasar: e.target.value })}
                  placeholder="350000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  required
                />
              </div>

              {/* Berat */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Berat (gram)</label>
                <input
                  type="number"
                  value={formData.berat}
                  onChange={(e) => setFormData({ ...formData, berat: e.target.value })}
                  placeholder="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                >
                  {Object.keys(PRODUCT_STATUS).map(status => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </div>

              {/* Aktif */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="aktif-product"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                  className="w-5 h-5 text-[#cb5094] rounded"
                />
                <label htmlFor="aktif-product" className="text-sm font-medium text-gray-700">
                  Produk Aktif
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImage={formData.gambarUrl}
              />

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Deskripsi produk..."
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              {editingProduct ? 'Update Produk' : 'Simpan Produk'}
            </button>
            <button
              onClick={handleCancelForm}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#cb5094]/30 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat produk...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <PackageSearch className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Produk Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterCategory || filterStatus 
                ? 'Coba ubah filter pencarian' 
                : 'Mulai dengan menambahkan produk pertama'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Produk</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Kategori</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Harga</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.gambarUrl || 'https://via.placeholder.com/100'}
                            alt={product.nama}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <div className="font-bold text-gray-800">{product.nama}</div>
                            <code className="text-xs text-gray-500">{product.slug}</code>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {product.category?.nama || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-[#cb5094]">
                          {formatPrice(product.hargaDasar)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                        {!product.aktif && (
                          <div className="mt-1 text-xs text-gray-500">Nonaktif</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewVariants(product.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title="Lihat Varian"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.nama)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {!loading && products.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600">
            Menampilkan <span className="font-bold text-[#cb5094]">{products.length}</span> dari{' '}
            <span className="font-bold text-[#cb5094]">{totalProducts}</span> produk
          </p>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
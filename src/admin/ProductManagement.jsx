import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Search, PackageSearch, Eye, X
} from 'lucide-react';
import { productAPI, categoryAPI, variantAPI } from '../utils/api';
import { formatPrice, getStatusLabel, getStatusColor, PRODUCT_STATUS } from '../utils/formatPrice';
import ImageUpload from '../components/ImageUpload';
import { Notification, useNotification } from '../pages/Notifications';

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
  
  // ✨ Notification hook
  const notification = useNotification();

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

  // Varian yang akan dibuat bersamaan dengan produk
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({
    ukuran: '',
    warna: '',
    stok: ''
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
      notification.error('Gagal memuat produk: ' + (error.message || 'Unknown error'));
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

  // Add variant to list
  const handleAddVariant = () => {
    if (!variantForm.ukuran || !variantForm.warna || !variantForm.stok) {
      notification.warning('Ukuran, warna, dan stok wajib diisi');
      return;
    }

    const newVariant = {
      id: Date.now(),
      ukuran: variantForm.ukuran,
      warna: variantForm.warna,
      stok: parseInt(variantForm.stok)
    };

    setVariants([...variants, newVariant]);
    setVariantForm({ ukuran: '', warna: '', stok: '' });
    notification.success('Varian ditambahkan ke daftar');
  };

  // Remove variant from list
  const handleRemoveVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id));
    notification.info('Varian dihapus dari daftar');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.categoryId || !formData.nama || !formData.hargaDasar) {
      notification.warning('Kategori, nama, dan harga wajib diisi');
      return;
    }

    const payload = {
      ...formData,
      hargaDasar: parseInt(formData.hargaDasar),
      berat: parseInt(formData.berat) || 0
    };

    try {
      if (editingProduct) {
        // Update produk
        await productAPI.update(editingProduct.id, payload);
        notification.success('✅ Produk berhasil diupdate!');
      } else {
        // Create produk baru
        console.log('Creating product with payload:', payload);
        const response = await productAPI.create(payload);
        
        console.log('=== PRODUCT CREATE RESPONSE ===');
        console.log('response.data:', response.data);
        
        // Extract ID - Backend return { message: "...", data: { id, nama, ... } }
        const newProductId = response.data?.data?.id;
        
        console.log('Extracted Product ID:', newProductId);
        
        if (!newProductId) {
          console.error('Product ID tidak ditemukan di response!');
          throw new Error('Product ID tidak ditemukan di response');
        }
        
        // Create variants jika ada
        if (variants.length > 0) {
          console.log(`Creating ${variants.length} variants for product ${newProductId}...`);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];
            
            try {
              // Generate SKU
              const baseSlug = formData.slug.toUpperCase().replace(/-/g, '');
              const size = variant.ukuran.toUpperCase().replace(/\s+/g, '');
              const color = variant.warna.toUpperCase().replace(/\s+/g, '');
              const timestamp = Date.now().toString().slice(-6);
              const random = Math.random().toString(36).substring(2, 5).toUpperCase();
              const sku = `${baseSlug}-${size}-${color}-${timestamp}-${random}`;

              const variantPayload = {
                sku,
                ukuran: variant.ukuran,
                warna: variant.warna,
                stok: variant.stok,
                hargaOverride: null,
                aktif: true
              };
              
              console.log(`[${i + 1}/${variants.length}] Creating variant:`, variantPayload);
              
              await variantAPI.create(newProductId, variantPayload);
              successCount++;
              
              console.log(`✅ Variant ${i + 1} created successfully`);
              
            } catch (variantError) {
              errorCount++;
              console.error(`❌ Failed to create variant ${i + 1}:`, variantError);
            }
          }
          
          if (errorCount > 0) {
            notification.warning(`Produk berhasil dibuat! ${successCount} varian berhasil, ${errorCount} varian gagal.`);
          } else {
            notification.success(`🎉 Produk dan ${successCount} varian berhasil dibuat!`);
          }
          
        } else {
          notification.success('✅ Produk berhasil dibuat!');
        }
      }
      
      handleCancelForm();
      fetchProducts();
      
    } catch (error) {
      console.error('=== ERROR SAVING PRODUCT ===');
      console.error('Error:', error);
      notification.error('❌ Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
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
    setVariants([]);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus produk "${nama}"?`)) return;

    try {
      await productAPI.delete(id);
      notification.success(`🗑️ Produk "${nama}" berhasil dihapus!`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      notification.error('❌ Gagal menghapus produk: ' + (error.message || 'Unknown error'));
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
    setVariants([]);
    setVariantForm({ ukuran: '', warna: '', stok: '' });
  };

  // Handle image uploaded
  const handleImageUploaded = (url) => {
    setFormData({ ...formData, gambarUrl: url });
    notification.success('📷 Gambar berhasil diupload!');
  };

  // View variants
  const handleViewVariants = (productId) => {
    navigate(`/admin/products/${productId}/variants`);
  };

  return (
    <div className="space-y-6">
      {/* Render Notifications */}
      <div className="fixed top-0 right-0 z-[100] space-y-3 p-4">
        {notification.notifications.map((notif) => (
          <Notification
            key={notif.id}
            type={notif.type}
            message={notif.message}
            duration={notif.duration}
            onClose={() => notification.removeNotification(notif.id)}
          />
        ))}
      </div>

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

          {/* Varian Section - Hanya tampil saat create (bukan edit) */}
          {!editingProduct && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Varian Produk (Opsional)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Tambahkan ukuran, warna, dan stok untuk setiap varian
              </p>

              {/* Variant Input Form */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Ukuran (S/M/L/XL)"
                    value={variantForm.ukuran}
                    onChange={(e) => setVariantForm({ ...variantForm, ukuran: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  />
                  <input
                    type="text"
                    placeholder="Warna"
                    value={variantForm.warna}
                    onChange={(e) => setVariantForm({ ...variantForm, warna: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  />
                  <input
                    type="number"
                    placeholder="Stok"
                    value={variantForm.stok}
                    onChange={(e) => setVariantForm({ ...variantForm, stok: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-[#cb5094] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#b04783] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah
                  </button>
                </div>
              </div>

              {/* Variants List */}
              {variants.length > 0 && (
                <div className="space-y-2">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                          {variant.ukuran}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                          {variant.warna}
                        </span>
                        <span className="text-gray-700 font-medium">
                          Stok: {variant.stok} pcs
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="text-sm text-gray-600 mt-2">
                    Total: {variants.length} varian
                  </div>
                </div>
              )}
            </div>
          )}

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
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, ArrowLeft, Package, X, Check
} from 'lucide-react';
import { productAPI, variantAPI } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

function ProductVariantManagement() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  const [formData, setFormData] = useState({
    sku: '',
    ukuran: '',
    warna: '',
    stok: '',
    hargaOverride: '',
    aktif: true
  });

  // Fetch product details
  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getById(productId);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Gagal memuat produk');
      navigate('/admin/products');
    }
  };

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await variantAPI.getByProductId(productId, true); // Include inactive
      setVariants(response.data || []); // Ensure it's always an array
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]); // Set empty array on error
      alert('Gagal memuat varian');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate SKU
  const generateSKU = () => {
    if (!product || !formData.ukuran || !formData.warna) return;
    
    const baseSlug = product.slug.toUpperCase().replace(/-/g, '-');
    const size = formData.ukuran.toUpperCase();
    const color = formData.warna.toUpperCase().replace(/\s+/g, '-');
    const timestamp = Date.now().toString().slice(-4);
    
    const sku = `${baseSlug}-${size}-${color}-${timestamp}`;
    setFormData({ ...formData, sku });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.sku || !formData.ukuran || !formData.warna || !formData.stok) {
      alert('SKU, ukuran, warna, dan stok wajib diisi');
      return;
    }

    const payload = {
      sku: formData.sku,
      ukuran: formData.ukuran,
      warna: formData.warna,
      stok: parseInt(formData.stok),
      hargaOverride: formData.hargaOverride ? parseInt(formData.hargaOverride) : null,
      aktif: formData.aktif
    };

    try {
      if (editingVariant) {
        await variantAPI.update(editingVariant.id, payload);
        alert('Varian berhasil diupdate!');
      } else {
        await variantAPI.create(productId, payload);
        alert('Varian berhasil dibuat!');
      }
      
      handleCancelForm();
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      alert('Gagal menyimpan varian: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle edit
  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setFormData({
      sku: variant.sku,
      ukuran: variant.ukuran,
      warna: variant.warna,
      stok: variant.stok.toString(),
      hargaOverride: variant.hargaOverride?.toString() || '',
      aktif: variant.aktif
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id, sku) => {
    if (!confirm(`Yakin ingin menghapus varian "${sku}"?`)) return;

    try {
      await variantAPI.delete(id);
      alert('Varian berhasil dihapus!');
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Gagal menghapus varian: ' + (error.message || 'Unknown error'));
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingVariant(null);
    setFormData({
      sku: '',
      ukuran: '',
      warna: '',
      stok: '',
      hargaOverride: '',
      aktif: true
    });
  };

  // Get unique sizes and colors (with safety check)
  const uniqueSizes = Array.isArray(variants) 
    ? [...new Set(variants.map(v => v.ukuran))]
    : [];
  const uniqueColors = Array.isArray(variants)
    ? [...new Set(variants.map(v => v.warna))]
    : [];

  // Calculate total stock (with safety check)
  const totalStock = Array.isArray(variants)
    ? variants.reduce((sum, v) => sum + (v.aktif ? v.stok : 0), 0)
    : 0;

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#cb5094]/30 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Varian</h1>
          <p className="text-gray-600 mt-1">{product.nama}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Varian
        </button>
      </div>

      {/* Product Info Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#cb5094]">
        <div className="flex items-start gap-6">
          <img
            src={product.gambarUrl || 'https://via.placeholder.com/150'}
            alt={product.nama}
            className="w-24 h-24 object-cover rounded-xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{product.nama}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Kategori</p>
                <p className="font-bold text-gray-800">{product.category?.nama || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Harga Dasar</p>
                <p className="font-bold text-[#cb5094]">{formatPrice(product.hargaDasar)}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Stok</p>
                <p className="font-bold text-green-600">{totalStock} pcs</p>
              </div>
              <div>
                <p className="text-gray-600">Total Varian</p>
                <p className="font-bold text-blue-600">{variants.length} varian</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-[#cb5094]">{variants.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Varian</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{totalStock}</div>
          <div className="text-sm text-gray-600 mt-1">Total Stok</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{uniqueSizes.length}</div>
          <div className="text-sm text-gray-600 mt-1">Ukuran</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{uniqueColors.length}</div>
          <div className="text-sm text-gray-600 mt-1">Warna</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#cb5094]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingVariant ? 'Edit Varian' : 'Tambah Varian Baru'}
            </h2>
            <button onClick={handleCancelForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Ukuran */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ukuran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ukuran}
                  onChange={(e) => setFormData({ ...formData, ukuran: e.target.value })}
                  onBlur={generateSKU}
                  placeholder="S / M / L / XL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  required
                />
              </div>

              {/* Warna */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Warna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.warna}
                  onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                  onBlur={generateSKU}
                  placeholder="Hitam / Navy / Maroon"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  required
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="AUTO-GENERATED"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] font-mono text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-all"
                    title="Generate SKU"
                  >
                    Auto
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  SKU harus unik untuk setiap varian
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Stok */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stok <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.stok}
                  onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                  placeholder="50"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                  required
                />
              </div>

              {/* Harga Override */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Harga Khusus (Opsional)
                </label>
                <input
                  type="number"
                  value={formData.hargaOverride}
                  onChange={(e) => setFormData({ ...formData, hargaOverride: e.target.value })}
                  placeholder={`Default: ${formatPrice(product.hargaDasar)}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan untuk menggunakan harga dasar produk
                </p>
              </div>

              {/* Aktif */}
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="aktif-variant"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                  className="w-5 h-5 text-[#cb5094] rounded"
                />
                <label htmlFor="aktif-variant" className="text-sm font-medium text-gray-700">
                  Varian Aktif
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          {formData.ukuran && formData.warna && (
            <div className="mt-6 bg-[#fffbf8] rounded-xl p-4 border border-[#cb5094]">
              <p className="text-sm text-gray-600 mb-2">Preview Varian:</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">
                    {formData.ukuran} - {formData.warna}
                  </p>
                  <p className="text-sm text-gray-600">
                    Stok: {formData.stok || 0} pcs
                  </p>
                  <p className="text-sm text-[#cb5094] font-bold">
                    {formData.hargaOverride 
                      ? formatPrice(parseInt(formData.hargaOverride))
                      : formatPrice(product.hargaDasar)
                    }
                  </p>
                </div>
                {formData.sku && (
                  <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg">
                    {formData.sku}
                  </code>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              {editingVariant ? 'Update Varian' : 'Simpan Varian'}
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

      {/* Variants Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#cb5094]/30 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat varian...</p>
            </div>
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Varian</h3>
            <p className="text-gray-600 mb-6">
              Tambahkan varian pertama untuk produk ini
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Varian Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">SKU</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Ukuran</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Warna</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Harga</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Stok</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {variant.sku}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                        {variant.ukuran}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                        {variant.warna}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-[#cb5094]">
                        {formatPrice(variant.hargaOverride || product.hargaDasar)}
                      </div>
                      {variant.hargaOverride && (
                        <div className="text-xs text-gray-500 line-through">
                          {formatPrice(product.hargaDasar)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${
                        variant.stok === 0 ? 'text-red-600' :
                        variant.stok < 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {variant.stok} pcs
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {variant.aktif ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                          <Check className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                          <X className="w-3 h-3" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(variant)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(variant.id, variant.sku)}
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
        )}
      </div>
    </div>
  );
}

export default ProductVariantManagement;
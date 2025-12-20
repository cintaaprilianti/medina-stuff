import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, ArrowLeft, Package, X, Check, ChevronRight
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
  
  const [variantStep, setVariantStep] = useState('colors');
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variantsToCreate, setVariantsToCreate] = useState([]);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [colorImages, setColorImages] = useState({});
  const [selectingImageForColor, setSelectingImageForColor] = useState(null);
  
  const [formData, setFormData] = useState({
    sku: '',
    ukuran: '',
    warna: '',
    stok: '',
    hargaOverride: '',
    aktif: true
  });

  // Load colorImages dari localStorage
  useEffect(() => {
    if (productId) {
      const saved = localStorage.getItem(`colorImages-${productId}`);
      if (saved) {
        try {
          setColorImages(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse colorImages', e);
        }
      }
      fetchProduct();
      fetchVariants();
    }
  }, [productId]);

  // Simpan colorImages ke localStorage
  useEffect(() => {
    if (productId && Object.keys(colorImages).length > 0) {
      localStorage.setItem(`colorImages-${productId}`, JSON.stringify(colorImages));
    }
  }, [colorImages, productId]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getById(productId);
      let productData = response.data?.data || response.data || response;
      
      if (productData && productData.slug) {
        setProduct(productData);
      } else {
        alert('Data produk tidak lengkap');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Gagal memuat produk');
      navigate('/admin/products');
    }
  };

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await variantAPI.getByProductId(productId, true);
      
      let variantsData = [];
      if (Array.isArray(response.data)) {
        variantsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        variantsData = response.data.data;
      } else if (Array.isArray(response)) {
        variantsData = response;
      }
      
      setVariants(variantsData);
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
      if (error.response?.status !== 404) {
        alert('Gagal memuat varian: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = (size, color) => {
    if (!product || !product.slug || !size || !color) return '';
    
    const baseSlug = product.slug.toUpperCase().replace(/-/g, '');
    const sizeCode = size.toUpperCase().replace(/\s+/g, '');
    const colorCode = color.toUpperCase().replace(/\s+/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    return `${baseSlug}-${sizeCode}-${colorCode}-${timestamp}-${random}`;
  };

  const handleAddColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()]);
      setNewColor('');
    }
  };

  const handleRemoveColor = (color) => {
    setColors(colors.filter(c => c !== color));
    setVariantsToCreate(variantsToCreate.filter(v => v.warna !== color));
    const newImages = { ...colorImages };
    delete newImages[color];
    setColorImages(newImages);
  };

  const handleNextToSizes = () => {
    if (colors.length === 0) {
      alert('Tambahkan minimal 1 warna');
      return;
    }
    setVariantStep('sizes');
  };

  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()]);
      setNewSize('');
    }
  };

  const handleRemoveSize = (size) => {
    setSizes(sizes.filter(s => s !== size));
    setVariantsToCreate(variantsToCreate.filter(v => v.ukuran !== size));
  };

  const handleNextToStocks = () => {
    if (sizes.length === 0) {
      alert('Tambahkan minimal 1 ukuran');
      return;
    }
    
    const newVariants = [];
    colors.forEach(color => {
      sizes.forEach(size => {
        newVariants.push({
          id: `${color}-${size}`,
          warna: color,
          ukuran: size,
          stok: 10
        });
      });
    });
    
    setVariantsToCreate(newVariants);
    setVariantStep('stocks');
  };

  const handleStockChange = (id, stok) => {
    setVariantsToCreate(variantsToCreate.map(v =>
      v.id === id ? { ...v, stok: parseInt(stok) || 0 } : v
    ));
  };

  const handleCreateMultipleVariants = async () => {
    if (variantsToCreate.length === 0) {
      alert('Tidak ada varian untuk dibuat');
      return;
    }
    
    if (!product || !product.slug) {
      alert('⚠️ Data produk tidak lengkap. Silakan refresh halaman.');
      return;
    }

    const confirmMsg = `Buat ${variantsToCreate.length} varian?\n${colors.length} warna × ${sizes.length} ukuran`;
    if (!confirm(confirmMsg)) return;

    try {
      let successCount = 0;
      let failCount = 0;

      for (const variant of variantsToCreate) {
        try {
          const sku = generateSKU(variant.ukuran, variant.warna);
          if (!sku) throw new Error('SKU generation failed');

          const payload = {
            sku,
            ukuran: variant.ukuran,
            warna: variant.warna,
            stok: parseInt(variant.stok) || 0,
            hargaOverride: null,
            aktif: true
          };

          await variantAPI.create(productId, payload);
          successCount++;
        } catch (error) {
          console.error(`Failed to create variant ${variant.ukuran}-${variant.warna}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`✅ Berhasil membuat ${successCount} varian${failCount > 0 ? `\n❌ ${failCount} gagal` : ''}!`);
        handleCancelForm();
        fetchVariants();
      }
    } catch (error) {
      console.error('Error creating variants:', error);
      alert('❌ Gagal membuat varian');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      alert('Gagal menyimpan varian');
    }
  };

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

  const handleDelete = async (id, sku) => {
    if (!confirm(`Yakin ingin menghapus varian "${sku}"?`)) return;

    try {
      await variantAPI.delete(id);
      alert('Varian berhasil dihapus!');
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Gagal menghapus varian');
    }
  };

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
    setColors([]);
    setSizes([]);
    setVariantsToCreate([]);
    setVariantStep('colors');
  };

  const safeVariants = Array.isArray(variants) ? variants : [];
  const uniqueSizes = [...new Set(safeVariants.map(v => v.ukuran))];
  const uniqueColors = [...new Set(safeVariants.map(v => v.warna))];
  const totalStock = safeVariants.reduce((sum, v) => sum + (v.aktif ? v.stok : 0), 0);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="p-3 hover:bg-pink-50 rounded-xl text-gray-600 hover:text-[#cb5094] transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Kelola Varian Produk</h1>
              <p className="text-gray-500 text-sm mt-1">{product.nama}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b54684] transition-all flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Tambah Varian
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Kategori</p>
            <p className="font-semibold text-gray-800">{product.category?.nama || '-'}</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Harga Dasar</p>
            <p className="font-semibold text-[#cb5094]">{formatPrice(product.hargaDasar)}</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Total Varian</p>
            <p className="font-semibold text-gray-800">{safeVariants.length}</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Total Stok</p>
            <p className="font-semibold text-gray-800">{totalStock} pcs</p>
          </div>
        </div>

        {/* Size & Color Count */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5 text-center">
            <div className="text-3xl font-bold text-[#cb5094] mb-1">{uniqueSizes.length}</div>
            <div className="text-sm text-gray-600">Ukuran</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5 text-center">
            <div className="text-3xl font-bold text-[#cb5094] mb-1">{uniqueColors.length}</div>
            <div className="text-sm text-gray-600">Warna</div>
          </div>
        </div>

        {/* Variant List */}
        <div className="space-y-4 lg:space-y-0">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat varian...</p>
            </div>
          ) : safeVariants.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-pink-100">
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-[#cb5094]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Varian</h3>
              <p className="text-gray-600 mb-4">Tambahkan varian untuk produk ini</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b54684]"
              >
                Tambah Varian
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {safeVariants.map((variant) => (
                  <div key={variant.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                        {colorImages[variant.warna] ? (
                          <img src={colorImages[variant.warna]} alt={variant.warna} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded block mb-2 truncate">{variant.sku}</code>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">{variant.warna}</span>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">{variant.ukuran}</span>
                        </div>
                        <p className="font-bold text-[#cb5094] text-lg">{formatPrice(variant.hargaOverride || product.hargaDasar)}</p>
                        <p className="text-sm text-gray-600 mt-1">Stok: <span className="font-bold">{variant.stok} pcs</span></p>
                        {variant.aktif ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                            <Check className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                            <X className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(variant)}
                        className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id, variant.sku)}
                        className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gradient-to-r from-pink-50 to-white border-b-2 border-pink-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Gambar</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">SKU</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Ukuran</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Warna</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Harga</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Stok</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {safeVariants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-pink-50/50 transition-colors">
                          <td className="px-6 py-4">
                            {colorImages[variant.warna] ? (
                              <img 
                                src={colorImages[variant.warna]} 
                                alt={variant.warna}
                                className="w-14 h-14 object-cover rounded-lg border-2 border-gray-200 hover:border-[#cb5094] transition-all"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                              {variant.sku}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                              {variant.ukuran}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                              {variant.warna}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-[#cb5094] text-sm">
                              {formatPrice(variant.hargaOverride || product.hargaDasar)}
                            </div>
                            {variant.hargaOverride && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatPrice(product.hargaDasar)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold">
                            {variant.stok} pcs
                          </td>
                          <td className="px-6 py-4 text-center">
                            {variant.aktif ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                <Check className="w-3 h-3" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                                <X className="w-3 h-3" />
                                Nonaktif
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => handleEdit(variant)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDelete(variant.id, variant.sku)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Image Picker Modal */}
        {selectingImageForColor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Pilih Foto untuk Warna: <span className="text-[#cb5094]">{selectingImageForColor}</span>
                </h3>
                <button
                  onClick={() => setSelectingImageForColor(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const images = product.gambarUrl?.split('|||').filter(url => url) || [];
                  
                  if (images.length === 0) {
                    return (
                      <div className="col-span-3 text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Belum ada foto produk</p>
                      </div>
                    );
                  }
                  
                  return images.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setColorImages({ ...colorImages, [selectingImageForColor]: url });
                        setSelectingImageForColor(null);
                      }}
                      className={`cursor-pointer rounded-xl overflow-hidden border-2 hover:border-[#cb5094] transition-all ${
                        colorImages[selectingImageForColor] === url
                          ? 'border-[#cb5094] ring-2 ring-[#cb5094] ring-offset-2'
                          : 'border-gray-200'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-32 object-cover" />
                      {colorImages[selectingImageForColor] === url && (
                        <div className="bg-[#cb5094] text-white text-center py-1 text-xs font-bold">
                          ✓ Dipilih
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] px-5 py-4 flex justify-between items-center rounded-t-3xl sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white">
                  {editingVariant ? 'Edit Varian' : 'Tambah Varian'}
                </h2>
                <button onClick={handleCancelForm} className="text-white hover:bg-white/20 p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {editingVariant ? (
                  <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Ukuran <span className="text-[#cb5094]">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.ukuran}
                            onChange={(e) => setFormData({ ...formData, ukuran: e.target.value })}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#cb5094]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Warna <span className="text-[#cb5094]">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.warna}
                            onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#cb5094]"
                            required
                          />
                        </div>
                        
                        {/* Preview gambar untuk single edit */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Gambar Varian (Opsional)
                          </label>
                          <div className="flex items-center gap-2">
                            {colorImages[formData.warna] ? (
                              <img 
                                src={colorImages[formData.warna]} 
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-lg border-2 border-[#cb5094]"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectingImageForColor(formData.warna)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                            >
                              {colorImages[formData.warna] ? 'Ganti Foto' : 'Pilih Foto'}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            SKU <span className="text-[#cb5094]">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.sku}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                              className="flex-1 px-3 py-2 text-xs border rounded-lg font-mono"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const sku = generateSKU(formData.ukuran, formData.warna);
                                if (sku) setFormData({ ...formData, sku });
                              }}
                              className="px-4 py-2 bg-pink-50 text-[#cb5094] rounded-lg font-semibold"
                            >
                              Auto
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Stok <span className="text-[#cb5094]">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.stok}
                            onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                            min="0"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#cb5094]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Harga Khusus (Opsional)
                          </label>
                          <input
                            type="number"
                            value={formData.hargaOverride}
                            onChange={(e) => setFormData({ ...formData, hargaOverride: e.target.value })}
                            placeholder={`Default: ${formatPrice(product.hargaDasar)}`}
                            className="w-full px-3 py-2 text-sm border rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="aktif-variant"
                            checked={formData.aktif}
                            onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <label htmlFor="aktif-variant" className="text-xs font-semibold">
                            Varian Aktif
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5">
                      <button
                        type="submit"
                        className="flex-1 bg-[#cb5094] text-white py-2.5 rounded-xl font-semibold hover:bg-[#b54684]"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="flex-1 bg-white border text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className={`flex items-center gap-1.5 ${variantStep === 'colors' ? 'text-[#cb5094]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${variantStep === 'colors' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>1</div>
                        <span className="font-semibold text-xs">Warna</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <div className={`flex items-center gap-1.5 ${variantStep === 'sizes' ? 'text-[#cb5094]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${variantStep === 'sizes' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>2</div>
                        <span className="font-semibold text-xs">Ukuran</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <div className={`flex items-center gap-1.5 ${variantStep === 'stocks' ? 'text-[#cb5094]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${variantStep === 'stocks' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>3</div>
                        <span className="font-semibold text-xs">Stok</span>
                      </div>
                    </div>

                    {variantStep === 'colors' && (
                      <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                        <h4 className="font-bold text-gray-800 mb-2 text-xs">Langkah 1: Tambahkan Warna & Pilih Foto</h4>
                        
                        {colors.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {colors.map(color => (
                              <div key={color} className="bg-white border border-[#cb5094] rounded-lg p-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {colorImages[color] ? (
                                    <img 
                                      src={colorImages[color]} 
                                      alt={color}
                                      className="w-12 h-12 object-cover rounded border-2 border-[#cb5094]"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                  
                                  <div>
                                    <span className="text-[#cb5094] font-semibold text-sm">{color}</span>
                                    <p className="text-xs text-gray-500">
                                      {colorImages[color] ? '✓ Foto dipilih' : 'Belum pilih foto'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectingImageForColor(color)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600"
                                  >
                                    {colorImages[color] ? 'Ganti' : 'Pilih Foto'}
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColor(color)}
                                    className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: Hitam, Putih"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                            className="flex-1 px-3 py-2 text-sm border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleAddColor}
                            className="bg-[#cb5094] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b54684]"
                          >
                            Tambah
                          </button>
                        </div>
                        
                        {colors.length > 0 && (
                          <button
                            type="button"
                            onClick={handleNextToSizes}
                            className="w-full mt-3 bg-[#cb5094] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#b54684] flex items-center justify-center gap-1.5"
                          >
                            Lanjut <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {variantStep === 'sizes' && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-800 text-xs">Langkah 2: Tambahkan Ukuran</h4>
                          <button
                            type="button"
                            onClick={() => setVariantStep('colors')}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            ← Kembali
                          </button>
                        </div>
                        
                        {sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {sizes.map(size => (
                              <span key={size} className="bg-white border border-blue-500 text-blue-600 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                {size}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSize(size)}
                                  className="hover:bg-blue-100 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: S, M, L"
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                            className="flex-1 px-3 py-2 text-sm border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleAddSize}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600"
                          >
                            Tambah
                          </button>
                        </div>

                        {sizes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleNextToStocks}
                            className="w-full mt-2 bg-[#cb5094] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#b54684] flex items-center justify-center gap-1.5"
                          >
                            Lanjut <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {variantStep === 'stocks' && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-gray-800 text-xs">Langkah 3: Atur Stok</h4>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Total: <span className="font-bold text-[#cb5094]">{variantsToCreate.length}</span> varian
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVariantStep('sizes')}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            ← Kembali
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {variantsToCreate.map(variant => (
                            <div key={variant.id} className="bg-white rounded-lg p-2.5 border flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-pink-100 text-[#cb5094] px-2 py-0.5 rounded-full text-xs font-semibold">
                                  {variant.warna}
                                </span>
                                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                  {variant.ukuran}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">Stok:</label>
                                <input
                                  type="number"
                                  value={variant.stok}
                                  onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                  className="w-16 px-2 py-1 border rounded text-xs"
                                  min="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 bg-white rounded-lg p-2.5 border border-green-200">
                          <p className="text-xs text-gray-600">
                            ✅ Total stok: <span className="font-bold text-green-600">{variantsToCreate.reduce((sum, v) => sum + v.stok, 0)} pcs</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleCreateMultipleVariants}
                          className="w-full mt-3 bg-[#cb5094] text-white py-2.5 rounded-xl font-semibold hover:bg-[#b54684]"
                        >
                          Buat {variantsToCreate.length} Varian
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductVariantManagement;
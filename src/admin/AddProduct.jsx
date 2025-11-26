import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Link2,
  FileText,
  AlertCircle,
  Image as ImageIcon,
  PackageSearch,
} from "lucide-react";

const AddProduct = ({ productId = null, onClose, onSuccess }) => {
  const isEdit = !!productId;

  const [formData, setFormData] = useState({
    nama: "",
    slug: "",
    deskripsi: "",
    hargaDasar: "",
    berat: "",
    kategoriId: "",
    status: "READY",
    active: true,
    imageUrl: "",
  });

  const [variants, setVariants] = useState([
    { sku: "", ukuran: "", warna: "", stok: 0, hargaOverride: "" },
  ]);

  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchProductDetails();
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setCategories([]);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const p = await res.json();
        setFormData({
          nama: p.nama || "",
          slug: p.slug || "",
          deskripsi: p.deskripsi || "",
          hargaDasar: p.hargaDasar || "",
          berat: p.berat || "",
          kategoriId: p.kategori?.id || "",
          status: p.status || "READY",
          active: p.active ?? true,
          imageUrl: p.imageUrl || "",
        });
        setImagePreview(p.imageUrl || "");
        if (p.variants?.length) {
          setVariants(
            p.variants.map((v) => ({
              sku: v.sku || "",
              ukuran: v.ukuran || "",
              warna: v.warna || "",
              stok: v.stok || 0,
              hargaOverride: v.hargaOverride || "",
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));
    if (name === "nama" && !isEdit) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Harus berupa gambar" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Ukuran maksimal 5MB" }));
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.imageUrl;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", imageFile);

    try {
      const res = await fetch("http://localhost:5000/api/upload/image", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        return data.imageUrl;
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: "Gagal upload gambar" }));
    } finally {
      setUploading(false);
    }
    return formData.imageUrl;
  };

  const handleVariantChange = (idx, field, value) => {
    const newVariants = [...variants];
    newVariants[idx][field] = value;

    if (field === "ukuran" || field === "warna") {
      const v = newVariants[idx];
      if (v.ukuran && v.warna) {
        const base = formData.slug.toUpperCase();
        const size = v.ukuran.toUpperCase().replace(/\s/g, "");
        const color = v.warna.toUpperCase().replace(/\s/g, "");
        newVariants[idx].sku = `${base}-${size}-${color}`;
      }
    }
    setVariants(newVariants);
  };

  const addVariant = () =>
    setVariants([...variants, { sku: "", ukuran: "", warna: "", stok: 0, hargaOverride: "" }]);
  const removeVariant = (i) => variants.length > 1 && setVariants(variants.filter((_, idx) => idx !== i));

  const validate = () => {
    const err = {};
    if (!formData.nama.trim()) err.nama = "Nama produk wajib diisi";
    if (!formData.slug.trim()) err.slug = "Slug wajib diisi";
    if (!formData.deskripsi.trim()) err.deskripsi = "Deskripsi wajib diisi";
    if (!formData.hargaDasar || formData.hargaDasar <= 0) err.hargaDasar = "Harga harus > 0";
    if (!formData.berat || formData.berat <= 0) err.berat = "Berat harus > 0";
    if (!formData.kategoriId) err.kategoriId = "Pilih kategori";

    variants.forEach((v, i) => {
      if (!v.ukuran.trim()) err[`v_${i}_ukuran`] = "Ukuran wajib";
      if (!v.warna.trim()) err[`v_${i}_warna`] = "Warna wajib";
      if (v.stok < 0) err[`v_${i}_stok`] = "Stok tidak boleh negatif";
    });

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const finalImageUrl = imageFile ? await uploadImage() : formData.imageUrl;

      const payload = {
        ...formData,
        hargaDasar: parseFloat(formData.hargaDasar),
        berat: parseInt(formData.berat),
        imageUrl: finalImageUrl,
      };

      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `http://localhost:5000/api/products/${productId}`
        : "http://localhost:5000/api/products";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan produk");

      const saved = await res.json();

      if (!isEdit) {
        for (const v of variants) {
          const variantPayload = {
            sku: v.sku,
            ukuran: v.ukuran,
            warna: v.warna,
            stok: parseInt(v.stok),
            ...(v.hargaOverride && { hargaOverride: parseFloat(v.hargaOverride) }),
            active: true,
          };
          await fetch(`http://localhost:5000/api/products/${saved.id}/variants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(variantPayload),
          });
        }
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: "Gagal menyimpan produk" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#d84698] via-[#c94a91] to-[#b84489] text-white px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <PackageSearch size={24} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                  {isEdit ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-white/80 text-sm mt-0.5 font-medium">
                  {isEdit ? "Update product information" : "Create a new product"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
              disabled={loading || uploading}
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* IMAGE UPLOAD */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3" style={{ letterSpacing: "-0.02em" }}>
              <div className="w-1.5 h-5 bg-gradient-to-b from-[#d84698] to-[#b84489] rounded-full"></div>
              Product Image
            </label>
            <div className="flex items-start gap-6">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative group">
                    <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded-2xl shadow-lg" />
                    <button
                      onClick={() => {
                        setImagePreview("");
                        setImageFile(null);
                        setFormData((p) => ({ ...p, imageUrl: "" }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#d84698] transition-all bg-gray-50">
                    <Upload className="w-10 h-10 text-[#d84698] mb-2" />
                    <span className="text-sm font-bold text-[#d84698]">Upload</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Format:</strong> JPG, PNG, WebP</p>
                <p><strong>Max:</strong> 5MB • <strong>Recommended:</strong> 1000×1000px</p>
                {errors.image && <p className="text-red-600 font-medium">{errors.image}</p>}
              </div>
            </div>
          </div>

          {/* PRODUCT NAME */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3" style={{ letterSpacing: "-0.02em" }}>
              <div className="w-1.5 h-5 bg-gradient-to-b from-[#d84698] to-[#b84489] rounded-full"></div>
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              name="nama"
              value={formData.nama}
              onChange={handleInput}
              placeholder="e.g., Premium Silk Hijab"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all text-base font-medium text-gray-800 placeholder:text-gray-400"
              disabled={loading || uploading}
            />
          </div>

          {/* ADVANCED SETTINGS TOGGLE */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-bold text-[#d84698] hover:text-[#b84489] transition-colors"
            style={{ letterSpacing: "-0.01em" }}
          >
            <div className={`transition-transform duration-300 ${showAdvanced ? "rotate-90" : ""}`}>▶</div>
            {showAdvanced ? "Hide Advanced Settings" : "Advanced Settings"}
          </button>

          {/* SLUG */}
          {showAdvanced && (
            <div className="animate-fadeIn">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3" style={{ letterSpacing: "-0.02em" }}>
                <Link2 size={16} className="text-[#d84698]" strokeWidth={2.5} />
                URL Slug <span className="text-red-500">*</span>
              </label>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleInput}
                placeholder="premium-silk-hijab"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl font-mono text-sm bg-gray-50/50 focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all text-gray-700"
                disabled={isEdit || loading || uploading}
              />
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-gray-500">
                <CheckCircle2 size={14} strokeWidth={2.5} />
                Auto-generated • SEO friendly
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3" style={{ letterSpacing: "-0.02em" }}>
              <FileText size={16} className="text-[#d84698]" strokeWidth={2.5} />
              Description
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleInput}
              rows={5}
              placeholder="Describe this product..."
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all resize-none font-medium text-gray-800 placeholder:text-gray-400"
              style={{ lineHeight: "1.7" }}
              disabled={loading || uploading}
            />
          </div>

          {/* PRICING & DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Base Price (Rp) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="hargaDasar"
                value={formData.hargaDasar}
                onChange={handleInput}
                placeholder="125000"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Weight (gram) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="berat"
                value={formData.berat}
                onChange={handleInput}
                placeholder="500"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Category <span className="text-red-500">*</span></label>
              <select
                name="kategoriId"
                value={formData.kategoriId}
                onChange={handleInput}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nama || c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVE STATUS */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-pink-50/30 to-purple-50/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    formData.active
                      ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200"
                      : "bg-gray-300"
                  }`}
                >
                  <CheckCircle2 size={24} strokeWidth={2.5} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-base mb-1" style={{ letterSpacing: "-0.02em" }}>
                    Product Status
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {formData.active ? "Active • Visible in store" : "Inactive • Hidden"}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInput}
                  className="sr-only peer"
                  disabled={loading || uploading}
                />
                <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-pink-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-[#d84698] peer-checked:to-[#b84489]"></div>
              </label>
            </div>
          </div>

          {/* VARIANTS (only on create) */}
          {!isEdit && (
            <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800">Product Variants</h3>
                <button
                  onClick={addVariant}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d84698] to-[#b84489] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  <Plus size={18} /> Add Variant
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((v, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border-2 border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full">Variant {i + 1}</span>
                      {variants.length > 1 && (
                        <button onClick={() => removeVariant(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <input
                        placeholder="Size (M, L, XL)"
                        value={v.ukuran}
                        onChange={(e) => handleVariantChange(i, "ukuran", e.target.value)}
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all"
                      />
                      <input
                        placeholder="Color"
                        value={v.warna}
                        onChange={(e) => handleVariantChange(i, "warna", e.target.value)}
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all"
                      />
                      <input
                        placeholder="SKU (auto)"
                        value={v.sku}
                        readOnly
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={v.stok}
                        onChange={(e) => handleVariantChange(i, "stok", e.target.value)}
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all"
                      />
                      <input
                        type="number"
                        placeholder="Price Override (opt)"
                        value={v.hargaOverride}
                        onChange={(e) => handleVariantChange(i, "hargaOverride", e.target.value)}
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GLOBAL ERROR */}
          {errors.submit && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-600 font-bold">{errors.submit}</p>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all text-base"
              style={{ letterSpacing: "-0.02em" }}
              disabled={loading || uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="flex-1 py-4 bg-gradient-to-r from-[#d84698] via-[#c94a91] to-[#b84489] text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-pink-300/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              {loading || uploading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                  {isEdit ? "Update Product" : "Create Product"}
                </>
              )}
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AddProduct;
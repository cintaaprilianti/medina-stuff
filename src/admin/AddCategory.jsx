import React, { useState, useEffect } from "react";
import { X, Link2, FileText, FolderTree, CheckCircle2 } from "lucide-react";

const AddCategory = ({ isOpen, onClose, editData, categories, onSuccess }) => {
  const [formData, setFormData] = useState({
    nama: "",
    slug: "",
    deskripsi: "",
    parentId: "",
    active: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        nama: editData.nama || "",
        slug: editData.slug || "",
        deskripsi: editData.deskripsi || "",
        parentId: editData.parent?.id || "",
        active: editData.active ?? true,
      });
    } else {
      setFormData({ nama: "", slug: "", deskripsi: "", parentId: "", active: true });
    }
    setShowAdvanced(false);
  }, [editData, isOpen]);

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));

    if (name === "nama" && !isEditMode) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama.trim()) return alert("Nama kategori wajib diisi!");
    if (!formData.slug.trim()) return alert("URL Slug wajib diisi!");

    try {
      setIsSubmitting(true);
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `http://localhost:5000/api/categories/${editData.id}`
        : "http://localhost:5000/api/categories";

      const payload = {
        nama: formData.nama.trim(),
        slug: formData.slug.trim(),
        deskripsi: formData.deskripsi.trim(),
        parentId: formData.parentId || null,
        active: formData.active,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Gagal menyimpan kategori.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#d84698] via-[#c94a91] to-[#b84489] text-white px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <FolderTree size={24} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                  {isEditMode ? "Edit Category" : "Add New Category"}
                </h2>
                <p className="text-white/80 text-sm mt-0.5 font-medium">
                  {isEditMode ? "Update category information" : "Create a new product category"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
              disabled={isSubmitting}
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Category Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3" style={{ letterSpacing: '-0.02em' }}>
              <div className="w-1.5 h-5 bg-gradient-to-b from-[#d84698] to-[#b84489] rounded-full"></div>
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              name="nama"
              value={formData.nama}
              onChange={handleInput}
              placeholder="e.g., Muslim Clothing"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all text-base font-medium text-gray-800 placeholder:text-gray-400"
              style={{ letterSpacing: '-0.01em' }}
              disabled={isSubmitting}
            />
          </div>

          {/* Toggle Advanced Settings */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-bold text-[#d84698] hover:text-[#b84489] transition-colors"
            style={{ letterSpacing: '-0.01em' }}
          >
            <div className={`transition-transform duration-300 ${showAdvanced ? 'rotate-90' : ''}`}>▶</div>
            {showAdvanced ? "Hide Advanced Settings" : "Advanced Settings"}
          </button>

          {/* URL Slug - Advanced */}
          {showAdvanced && (
            <div className="animate-fadeIn">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3" style={{ letterSpacing: '-0.02em' }}>
                <Link2 size={16} className="text-[#d84698]" strokeWidth={2.5} />
                URL Slug <span className="text-red-500">*</span>
              </label>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleInput}
                placeholder="muslim-clothing"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl font-mono text-sm bg-gray-50/50 focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all text-gray-700"
                disabled={isEditMode || isSubmitting}
              />
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-gray-500">
                <CheckCircle2 size={14} strokeWidth={2.5} />
                Auto-generated from name • SEO optimized
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3" style={{ letterSpacing: '-0.02em' }}>
              <FileText size={16} className="text-[#d84698]" strokeWidth={2.5} />
              Description
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleInput}
              placeholder="Describe this category to help customers understand..."
              rows={4}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#d84698] focus:ring-4 focus:ring-pink-100 transition-all resize-none font-medium text-gray-800 placeholder:text-gray-400"
              style={{ letterSpacing: '-0.01em', lineHeight: '1.7' }}
              disabled={isSubmitting}
            />
          </div>

          {/* Active Status */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-pink-50/30 to-purple-50/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  formData.active 
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200' 
                    : 'bg-gray-300'
                }`}>
                  <CheckCircle2 
                    size={24} 
                    strokeWidth={2.5}
                    className="text-white"
                  />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-base mb-1" style={{ letterSpacing: '-0.02em' }}>
                    Category Status
                  </div>
                  <div className="text-sm font-medium text-gray-600" style={{ letterSpacing: '-0.01em' }}>
                    {formData.active ? "Active • Visible in store" : "Inactive • Hidden from store"}
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
                  disabled={isSubmitting}
                />
                <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-pink-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-[#d84698] peer-checked:to-[#b84489]"></div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all text-base"
              style={{ letterSpacing: '-0.02em' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gradient-to-r from-[#d84698] via-[#c94a91] to-[#b84489] text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-pink-300/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
              style={{ letterSpacing: '-0.02em' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                  {isEditMode ? "Update Category" : "Create Category"}
                </>
              )}
            </button>
          </div>
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
  );
};

export default AddCategory;
import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { uploadAPI } from '../utils/api';

function ImageUpload({ 
  onImageUploaded, 
  currentImage = null, 
  maxSize = 5 
}) {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Reset success message setelah 3 detik
  const showSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess(false);

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validasi ukuran
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Ukuran maksimal ${maxSize}MB`);
      return;
    }

    // Preview instan
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setUploading(true);
      
      // Upload ke server
      const response = await uploadAPI.uploadImage(file);
      
      // Pastikan response ada url
      const uploadedUrl = response?.data?.url || response?.url;
      
      if (!uploadedUrl) {
        throw new Error('Server tidak mengembalikan URL gambar');
      }

      // Ganti preview jadi URL dari server (bukan blob lagi)
      setPreview(uploadedUrl);
      onImageUploaded?.(uploadedUrl);
      
      showSuccess();
    } catch (err) {
      console.error('Upload gagal:', err);
      
      // Kembalikan preview ke gambar lama jika gagal
      setPreview(currentImage);
      
      const msg = err.response?.data?.message || err.message || 'Gagal upload gambar';
      setError(msg);
    } finally {
      setUploading(false);
      // Reset input file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setError('');
    setSuccess(false);
    onImageUploaded?.(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-gray-800">
        Gambar Produk <span className="text-red-500">*</span>
      </label>

      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-2xl overflow-hidden transition-all
          ${preview ? 'border-gray-300' : 'border-[#cb5094] bg-pink-50/30'}
          ${uploading ? 'cursor-wait opacity-75' : 'cursor-pointer hover:shadow-lg'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />

        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview produk"
              className="w-full h-72 object-cover"
              onError={() => setPreview(null)}
            />

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">Ganti Gambar</p>
              </div>
            </div>

            <button
              onClick={handleRemove}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-xl transition-all z-10"
              title="Hapus gambar"
            >
              <X className="w-5 h-5" />
            </button>

            {uploading && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-[#cb5094] animate-spin mx-auto mb-3" />
                  <p className="font-medium text-gray-700">Sedang mengupload...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 px-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-16 h-16 text-[#cb5094] animate-spin mx-auto mb-4" />
                <p className="font-medium text-gray-700">Mengupload gambar...</p>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-[#cb5094] mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-800 mb-2">
                  Upload Gambar Produk
                </p>
                <p className="text-sm text-gray-600">
                  Klik di sini atau drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Format: JPG, PNG, WebP • Maks {maxSize}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Gambar berhasil diupload!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
          <X className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500 italic">
        Rekomendasi: Gunakan gambar 800x800px untuk tampilan terbaik
      </p>
    </div>
  );
}

export default ImageUpload;
import { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

function VariantSelector({ variants = [], onVariantSelect, selectedVariant = null }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  useEffect(() => {
    const activeVariants = variants.filter(v => v.aktif);
    const sizes = [...new Set(activeVariants.map(v => v.ukuran))];
    const colors = [...new Set(activeVariants.map(v => v.warna))];
    
    setAvailableSizes(sizes);
    setAvailableColors(colors);

    if (sizes.length === 1) setSelectedSize(sizes[0]);
    if (colors.length === 1) setSelectedColor(colors[0]);
  }, [variants]);

  useEffect(() => {
    if (selectedSize && selectedColor) {
      const matchedVariant = variants.find(
        v => v.ukuran === selectedSize && 
             v.warna === selectedColor && 
             v.aktif
      );

      if (matchedVariant && onVariantSelect) {
        onVariantSelect(matchedVariant);
      }
    } else {
      if (onVariantSelect) {
        onVariantSelect(null);
      }
    }
  }, [selectedSize, selectedColor, variants, onVariantSelect]);

  const getAvailableColorsForSize = (size) => {
    if (!size) return availableColors;
    
    return [...new Set(
      variants
        .filter(v => v.ukuran === size && v.aktif)
        .map(v => v.warna)
    )];
  };

  const getAvailableSizesForColor = (color) => {
    if (!color) return availableSizes;
    
    return [...new Set(
      variants
        .filter(v => v.warna === color && v.aktif)
        .map(v => v.ukuran)
    )];
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    
    const colorsForSize = getAvailableColorsForSize(size);
    if (!colorsForSize.includes(selectedColor)) {
      setSelectedColor('');
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    
    const sizesForColor = getAvailableSizesForColor(color);
    if (!sizesForColor.includes(selectedSize)) {
      setSelectedSize('');
    }
  };

  const getStockInfo = () => {
    if (!selectedSize || !selectedColor) return null;
    
    const variant = variants.find(
      v => v.ukuran === selectedSize && 
           v.warna === selectedColor && 
           v.aktif
    );
    
    return variant ? variant.stok : 0;
  };

  if (variants.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-yellow-800">
          Tidak ada varian tersedia untuk produk ini
        </p>
      </div>
    );
  }

  const stock = getStockInfo();
  const colorsForCurrentSize = getAvailableColorsForSize(selectedSize);
  const sizesForCurrentColor = getAvailableSizesForColor(selectedColor);

  return (
    <div className="space-y-6">
      {availableSizes.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Pilih Ukuran
          </label>
          <div className="flex flex-wrap gap-3">
            {availableSizes.map((size) => {
              const isAvailable = sizesForCurrentColor.includes(size);
              const isSelected = selectedSize === size;
              
              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  disabled={!isAvailable}
                  className={`min-w-[60px] px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg scale-105 ring-2 ring-[#cb5094] ring-offset-2'
                      : isAvailable
                      ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#cb5094] hover:text-[#cb5094] hover:scale-105'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 line-through'
                  }`}
                >
                  {size}
                  {isSelected && (
                    <Check className="inline-block w-4 h-4 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedSize 
              ? `Ukuran ${selectedSize} dipilih` 
              : 'Pilih ukuran terlebih dahulu'}
          </p>
        </div>
      )}

      {availableColors.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Pilih Warna
          </label>
          <div className="flex flex-wrap gap-3">
            {availableColors.map((color) => {
              const isAvailable = colorsForCurrentSize.includes(color);
              const isSelected = selectedColor === color;
              
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  disabled={!isAvailable}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg scale-105 ring-2 ring-[#cb5094] ring-offset-2'
                      : isAvailable
                      ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#cb5094] hover:text-[#cb5094] hover:scale-105'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 line-through'
                  }`}
                >
                  {color}
                  {isSelected && (
                    <Check className="inline-block w-4 h-4 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedColor 
              ? `Warna ${selectedColor} dipilih` 
              : 'Pilih warna yang tersedia'}
          </p>
        </div>
      )}

      {selectedSize && selectedColor && stock !== null && (
        <div className={`rounded-2xl p-4 border-2 ${
          stock > 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Stok Tersedia</p>
              <p className={`text-3xl font-bold ${
                stock > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stock} pcs
              </p>
            </div>

            <div>
              {stock > 10 && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-xs font-bold">
                  ✓ Stok Aman
                </div>
              )}
              {stock > 0 && stock <= 10 && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-xs font-bold animate-pulse">
                  ⚠ Stok Terbatas
                </div>
              )}
              {stock === 0 && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-xs font-bold">
                  ✗ Habis
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedVariant && (
        <div className="bg-gradient-to-r from-[#fffbf8] to-pink-50 rounded-2xl p-5 border-2 border-[#cb5094] shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-600 font-medium mb-1">
                Varian Terpilih
              </p>
              <p className="text-lg font-bold text-gray-800">
                {selectedVariant.ukuran} - {selectedVariant.warna}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                SKU: <span className="font-mono">{selectedVariant.sku}</span>
              </p>
              {selectedVariant.hargaOverride && (
                <p className="text-sm text-[#cb5094] font-bold mt-2">
                  Harga khusus varian ini
                </p>
              )}
            </div>
            <div className="bg-[#cb5094] rounded-full p-3">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}

      {(!selectedSize || !selectedColor) && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-800 font-medium text-center">
            ℹ️ Pilih ukuran dan warna untuk melihat ketersediaan stok
          </p>
        </div>
      )}
    </div>
  );
}

export default VariantSelector;
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { formatPrice, getStatusLabel, getStatusColor } from '../utils/formatPrice';

function ProductCard({ product, onAddToCart, onToggleWishlist, isInWishlist = false }) {
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(product);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) onToggleWishlist(product.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
      <div className="relative">
        <img
          src={product.gambarUrl || 'https://via.placeholder.com/400x400?text=No+Image'}
          alt={product.nama}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
          }}
        />

        {onToggleWishlist && (
          <button
            onClick={handleToggleWishlist}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
          >
            <Heart
              className={`w-4 h-4 ${
                isInWishlist ? 'fill-[#cb5094] text-[#cb5094]' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {product.category && (
          <div className="absolute bottom-2 left-2 bg-[#cb5094] text-white px-2 py-0.5 rounded-full text-xs font-bold">
            {product.category.nama}
          </div>
        )}

        {product.status && product.status !== 'READY' && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(product.status)}`}>
            {getStatusLabel(product.status)}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 h-10">
          {product.nama}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-600">4.8</span>
          <span className="text-xs text-gray-400 ml-auto">
            {product.aktif ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <p className="text-lg font-bold text-[#cb5094] mb-3">
          {formatPrice(product.hargaDasar)}
        </p>

        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={!product.aktif}
            className={`w-full py-2 rounded-lg text-sm font-bold transition-all transform ${
              product.aktif
                ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.aktif ? (
              <span className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Tambah
              </span>
            ) : (
              'Tidak Tersedia'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
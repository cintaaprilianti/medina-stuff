/**
 * Format number to Indonesian Rupiah currency
 * @param {number} price - Price in number
 * @returns {string} Formatted price string (e.g., "Rp 350.000")
 */
export const formatPrice = (price) => {
  if (price == null || isNaN(price)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Format price without "Rp" prefix
 * @param {number} price - Price in number
 * @returns {string} Formatted price string (e.g., "350.000")
 */
export const formatPriceNumber = (price) => {
  if (price == null || isNaN(price)) return '0';
  
  return new Intl.NumberFormat('id-ID').format(price);
};

/**
 * Parse formatted price string back to number
 * @param {string} formattedPrice - Formatted price string
 * @returns {number} Price in number
 */
export const parsePrice = (formattedPrice) => {
  if (!formattedPrice) return 0;
  
  // Remove all non-numeric characters except comma and dot
  const cleaned = formattedPrice.replace(/[^\d,-]/g, '');
  const number = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  
  return isNaN(number) ? 0 : number;
};

/**
 * Product status constants
 */
export const PRODUCT_STATUS = {
  READY: 'READY',
  PO: 'PO',
  DISCONTINUED: 'DISCONTINUED',
};

/**
 * Get status label in Indonesian
 */
export const getStatusLabel = (status) => {
  const labels = {
    READY: 'Ready Stock',
    PO: 'Pre Order',
    DISCONTINUED: 'Discontinued',
  };
  return labels[status] || status;
};

/**
 * Get status color for badges
 */
export const getStatusColor = (status) => {
  const colors = {
    READY: 'bg-green-100 text-green-800',
    PO: 'bg-yellow-100 text-yellow-800',
    DISCONTINUED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
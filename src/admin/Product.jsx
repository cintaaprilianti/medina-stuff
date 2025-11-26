import AddProduct from "./AddProduct";
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Plus, Search, Filter, PackageSearch } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchTerm, selectedCategory, selectedStatus, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(selectedStatus && { status: selectedStatus }),
      });

      const response = await fetch(`http://localhost:5000/api/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data.data) ? data.data : []);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
  
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data.data)) {
        setCategories(data.data);
      } else if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchProducts();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Hijabs': 'bg-pink-100 text-pink-700',
      'Dresses': 'bg-purple-100 text-purple-700',
      'Abayas': 'bg-blue-100 text-blue-700',
      'Gamis': 'bg-green-100 text-green-700',
      'Khimar': 'bg-yellow-100 text-yellow-700',
    };
    return colors[categoryName] || 'bg-gray-100 text-gray-700';
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-[#fffbf8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#cb5094] mb-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl flex items-center justify-center shadow-lg">
              <PackageSearch className="text-white" size={24} />
            </div>
            Product Management
          </h1>
          <p className="text-gray-600 text-lg ml-[60px]">Organize your product inventory</p>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* SEARCH */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent transition-all text-base"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              {/* FILTER BUTTON */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg ${
                  filterOpen
                    ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Filter size={20} />
                <span>Filter</span>
              </button>

              {/* ADD BUTTON */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Plus size={20} />
                <span>Add New</span>
              </button>
            </div>
          </div>

          {/* FILTER PANEL */}
          {filterOpen && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Category</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                        selectedCategory === ''
                          ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                          String(selectedCategory) === String(cat.id)
                            ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {cat.nama}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Status</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedStatus('')}
                      className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                        selectedStatus === ''
                          ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => setSelectedStatus('READY')}
                      className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                        selectedStatus === 'READY'
                          ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      Ready
                    </button>
                    <button
                      onClick={() => setSelectedStatus('PO')}
                      className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                        selectedStatus === 'PO'
                          ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      Pre-Order
                    </button>
                    <button
                      onClick={() => setSelectedStatus('DISCONTINUED')}
                      className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                        selectedStatus === 'DISCONTINUED'
                          ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      Discontinued
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white">
                <tr>
                  <th className="p-5 text-left font-semibold text-base">Name</th>
                  <th className="p-5 text-left font-semibold text-base">Description</th>
                  <th className="p-5 text-left font-semibold text-base">Category</th>
                  <th className="p-5 text-left font-semibold text-base">Varian</th>
                  <th className="p-5 text-left font-semibold text-base">Price</th>
                  <th className="p-5 text-center font-semibold text-base">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <div className="w-8 h-8 border-4 border-[#cb5094] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600 text-lg font-medium">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4 text-gray-500">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                          <PackageSearch size={40} className="opacity-50" />
                        </div>
                        <p className="font-semibold text-lg">No products found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`border-t border-gray-100 hover:bg-pink-50 transition-all ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-md">
                            <img
                              src={product.imageUrl || 'https://via.placeholder.com/60'}
                              alt={product.nama}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-base">{product.nama}</div>
                            <div className="text-sm text-gray-500">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div>
                          <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${getCategoryColor(product.kategori?.nama)}`}>
                            {product.kategori?.nama}
                          </span>
                          <div className="text-sm text-gray-600 mt-2 font-medium">
                            Rp {(product.hargaDasar ?? 0).toLocaleString("id-ID")}
                            <span className="mx-2 text-gray-300">•</span>
                            <span className={`font-bold ${getStockColor(product.variants?.[0]?.stok || 0)}`}>
                              Stock: {product.variants?.reduce((sum, v) => sum + v.stok, 0) || 0}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                          product.status === 'READY' ? 'bg-green-100 text-green-700' :
                          product.status === 'PO' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:shadow-md"
                            title="View"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            className="p-3 text-green-600 hover:bg-green-50 rounded-xl transition-all hover:shadow-md"
                            title="Edit"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:shadow-md"
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="bg-white rounded-full shadow-lg p-2 flex gap-2 border border-gray-100">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-full font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 transition-all"
              >
                Previous
              </button>
              <div className="px-5 py-2.5 text-gray-600 font-medium flex items-center">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-full font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 transform transition-all">
              <AddProduct
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                  fetchProducts();
                  setShowAddModal(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Filter,
  Search,
  FolderTree,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import AddCategory from "./AddCategory";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [parentFilter, setParentFilter] = useState("all");

  // ============================
  // FETCH CATEGORIES
  // ============================
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      const result = Array.isArray(data) ? data : data.data ?? [];

      const mapped = result.map((item) => ({
        id: item.id,
        nama: item.name,
        slug: item.slug,
        deskripsi: item.description || "",
        parent: item.parent
          ? { id: item.parent.id ?? item.parentId, nama: item.parent.name }
          : null,
        active: item.active ?? true,
      }));

      setCategories(mapped);
    } catch (err) {
      console.error("Fetch category failed:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ============================
  // PARENT CATEGORIES
  // ============================
  const parentCategories = useMemo(() => {
    const parents = categories.filter((c) => c.parent === null);
    const unique = [];
    const seen = new Set();
    for (const p of parents) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        unique.push({ id: p.id, nama: p.nama });
      }
    }
    return unique;
  }, [categories]);

  // ============================
  // FILTER & SEARCH
  // ============================
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.nama
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesParent =
      parentFilter === "all"
        ? true
        : parentFilter === "no-parent"
        ? cat.parent === null
        : String(cat.parent?.id) === String(parentFilter);

    return matchesSearch && matchesParent;
  });

  // ============================
  // MODAL HANDLERS
  // ============================
  const openAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditData(cat);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditData(null);
  };

  const handleSuccess = () => {
    fetchCategories();
  };

  // ============================
  // DELETE
  // ============================
  const deleteCategory = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/categories/${deleteConfirm}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.ok) {
        setDeleteConfirm(null);
        fetchCategories();
      } else {
        let errText = "Gagal menghapus kategori.";
        try {
          const errJson = await res.json();
          if (errJson?.message) errText = errJson.message;
        } catch {}
        alert(errText);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan saat menghapus kategori.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#cb5094] mb-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl flex items-center justify-center shadow-lg">
              <FolderTree className="text-white" size={24} />
            </div>
            Category Management
          </h1>
          <p className="text-gray-600 text-lg ml-[60px]">Organize your product categories</p>
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
                placeholder="Search categories..."
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
                onClick={openAdd}
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
              {categories.length === 0 ? (
                <p className="text-gray-500 italic text-center">No categories to filter</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {/* ALL */}
                  <button
                    onClick={() => setParentFilter("all")}
                    className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                      parentFilter === "all"
                        ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Categories
                  </button>

                  {/* NO PARENT */}
                  <button
                    onClick={() => setParentFilter("no-parent")}
                    className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                      parentFilter === "no-parent"
                        ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Root Categories
                  </button>

                  {/* Parent categories */}
                  {parentCategories.map((pc) => (
                    <button
                      key={pc.id}
                      onClick={() => setParentFilter(pc.id)}
                      className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                        String(parentFilter) === String(pc.id)
                          ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {pc.nama}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white">
                <tr>
                  <th className="p-5 text-left font-semibold text-base">Category Name</th>
                  <th className="p-5 text-left font-semibold text-base">Description</th>
                  <th className="p-5 text-left font-semibold text-base">Status</th>
                  <th className="p-5 text-center font-semibold text-base">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <div className="w-8 h-8 border-4 border-[#cb5094] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600 text-lg font-medium">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4 text-gray-500">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                          <FolderTree size={40} className="opacity-50" />
                        </div>
                        <p className="font-semibold text-lg">No categories found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      className={`border-t border-gray-100 hover:bg-pink-50 transition-all ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-xl flex items-center justify-center shadow-md">
                            <FolderTree className="text-white" size={18} />
                          </div>
                          <span className="font-semibold text-gray-800 text-base">{cat.nama}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <code className="bg-gray-100 px-4 py-2 rounded-xl text-sm text-gray-700 font-mono">
                          /{cat.slug}
                        </code>
                      </td>
                      <td className="p-5">
                        {cat.parent?.nama ? (
                          <div className="flex items-center gap-2">
                            <FolderTree className="text-[#cb5094]" size={18} />
                            <span className="text-gray-700 font-medium">{cat.parent.nama}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No parent</span>
                        )}
                      </td>
                      <td className="p-5">
                        {cat.active ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold shadow-sm">
                            <ToggleRight size={20} />
                            Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold shadow-sm">
                            <ToggleLeft size={20} />
                            Inactive
                          </div>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:shadow-md"
                            title="Edit category"
                          >
                            <Edit3 size={20} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(cat.id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:shadow-md"
                            title="Delete category"
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

        {/* ADD/EDIT MODAL */}
        <AddCategory
          isOpen={modalOpen}
          onClose={closeModal}
          editData={editData}
          categories={categories}
          onSuccess={handleSuccess}
        />

        {/* DELETE CONFIRM */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-red-100 rounded-2xl">
                  <Trash2 className="text-red-600" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Delete Category?</h3>
              </div>

              <p className="text-gray-600 mb-8 text-base leading-relaxed">
                Are you sure you want to delete this category? This action cannot be undone and may affect related products.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteCategory}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
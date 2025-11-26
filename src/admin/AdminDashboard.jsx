import { useState } from "react";
import {
  Menu, X, User, Bell,
  PackageSearch, Settings, LogOut,
  FolderTree,
  ClipboardList,
  CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";
import Products from "./Product";
import Category from "./Category";   

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {isSidebarOpen ? (
                  <X className="w-6 h-6 text-[#cb5094]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#cb5094]" />
                )}
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                  <img
                    src="/logo.png"
                    alt="Medina Stuff Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="hidden sm:block text-base text-gray-600 font-medium italic tracking-wide">
                  Medina Stuff
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <Bell className="w-6 h-6 text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="hidden sm:flex items-center space-x-2 pl-2">
                <div className="w-8 h-8 bg-[#cb5094] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Cinta</span>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex pt-16">

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="h-full overflow-y-auto py-6">
            <nav className="space-y-2 px-4">

              {[
                { tab: "category", icon: FolderTree, label: "Category" },   // ← ditambah
                { tab: "products", icon: PackageSearch, label: "Products" },
                { tab: "orders", icon: ClipboardList, label: "Orders" },
                { tab: "transactions", icon: CreditCard, label: "Transactions" },
                { tab: "settings", icon: Settings, label: "Settings" },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    activeTab === item.tab
                      ? "bg-[#cb5094] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}

              <hr className="my-4" />

              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>

            </nav>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-8">
          {activeTab === "category" && <Category />}   {/* ← tampilkan Category */}
          {activeTab === "products" && <Products />}   {/* ← tampilkan Products */}
        </main>

      </div>
    </div>
  );
}
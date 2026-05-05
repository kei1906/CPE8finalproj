"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Search, Grid, List, 
  Clock, Plus, AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";

export default function ItemsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("found");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("status", activeTab)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <header className="p-6 max-w-6xl mx-auto">
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-orange-500">
              {activeTab === 'found' ? 'Found Items' : 'Lost Items'}
            </h1>
          </div>
          
          <div className="flex bg-black border border-white/10 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-gray-400"}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-orange-500 text-white" : "text-gray-400"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search items" // Match your screenshot placeholder
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-orange-500/50 transition-all"
          />
        </div>

        {/* Toggle Tabs (Pill Style) */}
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
          {["found", "lost"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? "border border-orange-500 text-orange-500 bg-orange-500/5" 
                : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm italic">Scanning database...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center">
             <AlertCircle size={48} className="text-gray-700 mx-auto mb-4" />
             <p className="text-gray-500">No items match your search</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredItems.map((item) => (
              <motion.div 
                layout
                key={item.id} 
                onClick={() => router.push(`/items/${item.id}`)}
                className="group cursor-pointer bg-white/5 border border-white/10 rounded-4xl overflow-hidden hover:border-orange-500/40 transition-all"
              >
                <div className="h-56 w-full overflow-hidden">
                  <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Plus Button */}
      <button
        onClick={() => router.push('/item')}
        className="fixed bottom-10 right-10 w-16 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-black shadow-2xl shadow-orange-500/40"
      >
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
  );
}
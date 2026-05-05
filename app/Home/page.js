"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Tag, Plus, MessageCircle, User, Camera, Image, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostModal, setShowPostModal] = useState(false);
  const router = useRouter();
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setShowPostModal(false);
      router.push(`/item?preview=${encodeURIComponent(previewUrl)}`);
    }
  };

  return (
    <div className="min-h-screen text-white pb-60 font-sans selection:bg-orange-500/30 flex flex-col items-center justify-center bg-linear-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#7c2d1233]">
      
      {/* Hidden Inputs */}
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileChange} />

      <div className="w-full max-w-md px-6 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-orange-500 to-orange-600 drop-shadow-2xl"
        >
          FoundIt
        </motion.h1>
        <motion.p className="text-orange-300/70 mt-4 text-lg font-medium">Reuniting items with owners</motion.p>
        
        <div className="relative group my-12">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
          <input 
            type="text"
            placeholder="Search items..."
            className="w-full bg-white/10 backdrop-blur-xl border border-orange-500/30 rounded-3xl py-5 pl-16 pr-6 outline-none focus:ring-4 focus:ring-orange-500/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Choice Modal (Report Found Item) */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center backdrop-blur-sm p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/60 border border-orange-500/30 p-8 rounded-[2.5rem] w-full max-w-sm relative"
            >
              <button onClick={() => setShowPostModal(false)} className="absolute top-6 right-6 text-orange-400">
                <X size={24} />
              </button>
              
              <h2 className="text-xl font-bold mb-8 text-left">Report Found Item</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-orange-500/20 rounded-2xl hover:bg-orange-500/10 transition-colors group"
                >
                  <Camera size={32} className="text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Camera</span>
                </button>

                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-orange-500/20 rounded-2xl hover:bg-orange-500/10 transition-colors group"
                >
                  <Image size={32} className="text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Gallery</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-orange-500/30 flex items-center justify-around px-6 z-50">
        <NavIcon icon={<Search size={24} />} label="Explore" active onClick={() => router.push('/Home')} />
        <NavIcon icon={<Tag size={24} />} label="Items" onClick={() => router.push('/items')} />
        
        <motion.button 
          whileTap={{ scale: 0.92 }}
          className="p-5 rounded-full -translate-y-7 border-4 border-black bg-linear-to-br from-orange-500 to-orange-700 shadow-2xl shadow-orange-500/50"
          onClick={() => setShowPostModal(true)}
        >
          <Plus size={28} color="white" strokeWidth={3} />
        </motion.button>

        <NavIcon icon={<MessageCircle size={24} />} label="Chat" onClick={() => router.push('/chat')} />
        <NavIcon icon={<User size={24} />} label="Profile" onClick={() => router.push('/Profile')} />
      </nav>
    </div>
  );
}

function NavIcon({ icon, label, active = false, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-orange-400' : 'text-orange-300/60'}`}>
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';

function PostItemContent() {
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview');
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!preview) {
      setError("Image preview lost. Please retake the photo.");
    }
  }, [preview]);

  const handlePost = async () => {
    if (!title || !description || !preview) return alert("Please fill in all fields");

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const fetchResponse = await fetch(preview);
      if (!fetchResponse.ok) throw new Error("Image expired. Please try again.");
      const blob = await fetchResponse.blob();

      const fileName = `${user.id}/${Date.now()}.jpg`;
      await supabase.storage.from('items').upload(fileName, blob);
      const { data: { publicUrl } } = supabase.storage.from('items').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('items').insert([
        { title, description, image_url: publicUrl, finder_id: user.id }
      ]);

      if (dbError) throw dbError;
      router.push('/Home');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <button onClick={() => router.back()} className="text-orange-400 underline">Go Back</button>
    </div>
  );

  return (
    /* FIXED: Using bg-linear-to-br to satisfy Tailwind v4 warnings */
    <div className="min-h-screen text-white p-8 bg-linear-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#7c2d1233]">
      <button onClick={() => router.back()} className="mb-6 text-orange-400"><ArrowLeft /></button>
      <h1 className="text-4xl font-bold mb-6">Report Found Item</h1>
      <div className="w-full h-64 rounded-3xl overflow-hidden border-2 border-orange-500/30 mb-6 bg-black">
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
      </div>
      <div className="space-y-4">
        <input className="w-full bg-white/5 border border-orange-500/20 p-4 rounded-2xl outline-none" placeholder="Item Name" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full bg-white/5 border border-orange-500/20 p-4 rounded-2xl h-32 outline-none" placeholder="Details..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <button 
          onClick={handlePost} 
          disabled={loading}
          /* FIXED: Using bg-linear-to-r for the button */
          className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-linear-to-r from-[#ff6b35] to-[#ff8c42]"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Post to FoundIt</>}
        </button>
      </div>
    </div>
  );
}

// Wrapping in Suspense is required when using useSearchParams in Next.js
export default function PostItem() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <PostItemContent />
    </Suspense>
  );
}
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Send, Loader2, MessageCircle, User, Image, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("itemId");
  const supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    getUser();
    fetchChats();
  }, []);

  useEffect(() => {
    return () => {
      if (selectedChat) {
        supabaseClient.removeAllChannels();
      }
    };
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const unsubscribe = subscribeToMessages(selectedChat.id);
      return unsubscribe;
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const fetchChats = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .select("*, messages(id, content, sender_id, created_at), item:items(title, image_url)")
      .or(`finder_id.eq.${user.id},claimer_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setChats(data || []);
  };

  const fetchMessages = async (chatId) => {
    const { data } = await supabaseClient
      .from("messages")
      .select("*, profiles!sender_id_fkey(username)")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const subscribeToMessages = (chatId) => {
    const channel = supabaseClient
      .channel("chat-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          fetchMessages(chatId);
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => supabaseClient.removeChannel(channel);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const { error } = await supabaseClient
      .from("messages")
      .insert({
        chat_id: selectedChat.id,
        sender_id: user.id,
        content: newMessage.trim()
      });

    if (error) {
      alert("Failed to send: " + error.message);
    } else {
      setNewMessage("");
    }
  };

  const createChat = async (itemId) => {
    if (!user || !itemId) return;
    const { data: existing } = await supabase
      .from("chats")
      .select("id")
      .eq("item_id", itemId)
      .or(`finder_id.eq.${user.id},claimer_id.eq.${user.id}`).single();

    if (existing) {
      setSelectedChat(existing);
      return;
    }

    const { data: item } = await supabase
      .from("items")
      .select("finder_id")
      .eq("id", itemId)
      .single();

    if (!item) {
      alert("Item not found");
      return;
    }

    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({
        item_id: itemId,
        finder_id: item.finder_id,
        claimer_id: user.id
      })
      .select()
      .single();

    if (error) {
      alert("Failed to create chat: " + error.message);
    } else {
      setSelectedChat(newChat);
      setChats([newChat, ...chats]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center p-8">
        <div className="text-center">
          <MessageCircle size={64} className="mx-auto mb-4 text-orange-400/50" />
          <p className="text-white text-lg">Please log in to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#7c2d1233] text-white p-4 pb-24 font-sans">
      {/* Header */}
      <div className="flex items-center mb-6 p-2">
        <button onClick={() => router.back()} className="p-3 mr-3 hover:bg-orange-500/20 rounded-2xl transition-all shrink-0">
          <ArrowLeft size={20} className="text-orange-400" />
        </button>
        <h1 className="text-2xl font-bold bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Messages</h1>
      </div>

      <div className="flex h-[calc(100vh-220px)] gap-4">
        {/* Chats List */}
        <div className="w-80 flex flex-col bg-black/30 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-4 shadow-2xl shadow-orange-500/10 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 -mr-4">
            <AnimatePresence>
              {chats.map((chat) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, scale: 0.95, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 20 }}
                  layout
                  onClick={() => setSelectedChat(chat)}
                  className={`group w-full p-4 rounded-2xl flex items-start gap-3 hover:bg-orange-500/10 transition-all border border-orange-500/20 overflow-hidden relative ${selectedChat?.id === chat.id ? "bg-orange-500/20 border-orange-500/40 ring-2 ring-orange-500/50 shadow-orange-500/25" : ""}`}
                >
                  <div className="w-12 h-12 shrink-0 bg-linear-to-br from-orange-500/20 to-orange-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-orange-500/30">
                    <MessageCircle size={20} className="text-orange-400 drop-shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate bg-linear-to-r from-white to-orange-100 bg-clip-text text-transparent group-hover:from-orange-100">{chat.item?.title || "New Conversation"}</p>
                    <p className="text-xs text-orange-300/80 truncate mt-0.5">
                      {chat.messages?.[0]?.content ? chat.messages[0].content.slice(0, 35) + "..." : "No messages yet"}
                    </p>
                  </div>
                  {selectedChat?.id === chat.id && (
                    <div className="absolute -right-2 -top-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-background shadow-lg" />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
            {chats.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-12 text-orange-400/60"
              >
                <MessageCircle size={48} className="mx-auto mb-4 opacity-40" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm opacity-75 mt-1">Chats appear here when someone messages you about a found item</p>
              </motion.div>
            )}
          </div>
          
          {itemId && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => createChat(itemId)}
              className="px-6 py-3 bg-linear-to-r from-orange-500 via-orange-500/90 to-orange-600 rounded-2xl font-bold shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/50 transition-all border border-orange-500/50 text-white text-sm uppercase tracking-wide"
            >
              💬 Chat about found item
            </motion.button>
          )}
        </div>

        {/* Active Chat */}
        <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-xl border border-orange-500/20 rounded-3xl shadow-2xl shadow-orange-500/5 overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-orange-500/20 bg-black/40 backdrop-blur-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-br from-orange-400/20 to-orange-500/20 rounded-2xl flex items-center justify-center border-2 border-orange-500/30">
                  <Image size={20} className="text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-xl truncate bg-linear-to-r from-white to-orange-200 bg-clip-text text-transparent">
                    {selectedChat.item?.title || "Chat"}
                  </h2>
                  <p className="text-sm text-orange-400/80 font-medium">Found item discussion</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/10 min-h-0">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] p-4 rounded-3xl shadow-lg ${
                        msg.sender_id === user.id
                          ? "bg-linear-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/50"
                          : "bg-white/10 backdrop-blur-sm border border-white/10 shadow-gray-900/50 text-white"
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-2 opacity-75 text-xs">
                          <Clock size={12} />
                          {new Date(msg.created_at).toLocaleString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {messages.length === 0 && selectedChat && (
                  <div className="flex flex-col items-center justify-center h-64 text-orange-400/60">
                    <MessageCircle size={64} className="mb-4 opacity-30" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm opacity-75 mt-1">Be the first to say hi!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-orange-500/20 bg-black/40 backdrop-blur-sm">
                <div className="flex items-end gap-3">
                  <input
                    ref={(el) => el?.focus()}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 max-h-24 min-h-11 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-3xl text-white placeholder:text-orange-400/60 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none resize-none transition-all shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-4 bg-linear-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-400 disabled:to-orange-500 disabled:cursor-not-allowed rounded-3xl shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/60 transition-all flex items-center justify-center min-w-13 h-13 border border-orange-500/50 disabled:opacity-50"
                  >
                    <Send size={20} className="text-white" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 bg-linear-to-b from-transparent to-black/50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center text-orange-400/60"
              >
                <MessageCircle size={96} className="mx-auto mb-6 opacity-20 drop-shadow-2xl" />
                <h2 className="text-2xl font-bold mb-3 bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Welcome to Messages
                </h2>
                <p className="text-lg mb-8 max-w-md mx-auto leading-relaxed opacity-80">
                  Start a conversation when someone wants to claim your found item,
                  or respond when others message you about items you posted.
                </p>
                {itemId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => createChat(itemId)}
                    className="px-8 py-4 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-3xl font-bold text-lg shadow-2xl shadow-orange-500/50 hover:shadow-3xl hover:shadow-orange-500/60 transition-all border border-orange-500/50 text-white uppercase tracking-wide"
                  >
                    💬 Start Item Chat
                  </motion.button>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
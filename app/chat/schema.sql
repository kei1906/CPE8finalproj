-- Run this in Supabase SQL Editor (dashboard.supabase.com > SQL Editor)

-- Enable RLS later if needed
-- Chat table: links item to finder/claimer
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  finder_id UUID REFERENCES auth.users(id),
  claimer_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Indexes
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_chats_item_id ON public.chats(item_id);
CREATE INDEX idx_chats_finder_id ON public.chats(finder_id);
CREATE INDEX idx_chats_claimer_id ON public.chats(claimer_id);


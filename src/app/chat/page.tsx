
"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const db = useFirestore();
  const { user } = useUser();

  // Fetch recent messages to find conversation partners
  const recentMessagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: allMessages, isLoading } = useCollection(recentMessagesQuery);

  // Group messages to show only one entry per person (Inbox)
  const uniqueConversations = useMemo(() => {
    if (!allMessages || !user) return [];
    
    const map = new Map();
    allMessages.forEach(msg => {
      // Find the "other" person in the conversation
      const otherId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
      
      if (!map.has(otherId)) {
        map.set(otherId, {
          ...msg,
          partnerId: otherId,
          // Simulated online status - in a real app this would come from a presence system
          isOnline: Math.random() > 0.6 
        });
      }
    });

    return Array.from(map.values()).filter(conv => 
       conv.partnerId.toLowerCase().includes(searchQuery.toLowerCase()) || 
       conv.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allMessages, user, searchQuery]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24">
      <div className="px-6 mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Sphere Inbox</h1>
      </div>

      <div className="px-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Recent Messages</p>
        
        {uniqueConversations.length > 0 ? (
          <div className="divide-y divide-border/30">
            {uniqueConversations.map((msg) => (
              <Link 
                key={msg.id} 
                href={`/chat/${msg.partnerId}`}
                className="flex items-center gap-4 px-6 py-5 hover:bg-white transition-colors"
              >
                <div className="relative">
                  <Avatar className={cn(
                    "h-14 w-14 border-2 shadow-md transition-all",
                    msg.isOnline ? "border-green-500 ring-4 ring-green-500/20" : "border-background"
                  )}>
                    <AvatarFallback className="bg-primary/5 text-primary font-black uppercase">{msg.partnerId[0]}</AvatarFallback>
                  </Avatar>
                  {msg.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate">Innovator</h3>
                    <span className="text-[9px] text-muted-foreground/60 font-bold uppercase">Active</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">{msg.text}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4 opacity-30 px-10">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-14 w-full bg-muted rounded-2xl" />
                <div className="h-14 w-full bg-muted rounded-2xl" />
              </div>
            ) : (
              <>
                <MessageSquare size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No conversations found. Share your ideas to start chatting!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

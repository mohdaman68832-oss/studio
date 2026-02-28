"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  // Real messages query for the current user (where they are the sender)
  // We'll also fetch where they are the receiver to show full inbox
  const sentMessagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "messages"),
      where("senderId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user?.uid]);

  const receivedMessagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: sentMessages, isLoading: sentLoading } = useCollection(sentMessagesQuery);
  const { data: receivedMessages, isLoading: receivedLoading } = useCollection(receivedMessagesQuery);

  const uniqueConversations = useMemo(() => {
    if (!user) return [];
    
    const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
    allMessages.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const map = new Map();
    allMessages.forEach(msg => {
      const otherId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
      if (!map.has(otherId)) {
        map.set(otherId, {
          ...msg,
          partnerId: otherId,
          isOnline: Math.random() > 0.4 
        });
      }
    });

    return Array.from(map.values()).filter(conv => 
       conv.partnerId.toLowerCase().includes(searchQuery.toLowerCase()) || 
       conv.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sentMessages, receivedMessages, user, searchQuery]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = sentLoading || receivedLoading;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24">
      <div className="px-6 mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Inbox</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Direct Messages</p>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search messages..." 
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
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
                    "h-14 w-14 border-2 transition-all duration-300",
                    msg.isOnline ? "border-green-500 ring-4 ring-green-500/20" : "border-transparent"
                  )}>
                    <AvatarFallback className="bg-primary/5 text-primary font-black uppercase">
                      {msg.partnerId[0]}
                    </AvatarFallback>
                  </Avatar>
                  {msg.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate">
                      @{msg.partnerId.substring(0, 8)}
                    </h3>
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                    {msg.text}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4 opacity-30 px-10">
            {isLoading ? (
              <div className="animate-pulse space-y-4 px-6">
                {[1, 2, 3].map(i => <div key={i} className="h-14 w-full bg-muted rounded-2xl" />)}
              </div>
            ) : (
              <>
                <MessageSquare size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No messages found</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
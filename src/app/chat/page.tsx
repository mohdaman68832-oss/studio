"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24">
      <div className="px-6 mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Inbox</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Connect with Innovators</p>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search innovators..." 
            className="pl-12 h-14 bg-card border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6 space-y-4">
        {isMessagesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => (
            <Link key={msg.id} href={`/chat/${msg.senderId}`} className="flex items-center gap-4 bg-card p-4 rounded-3xl border border-border/50 shadow-sm hover:border-primary transition-all">
               <Avatar className="h-12 w-12">
                 <AvatarFallback className="font-black bg-primary/10 text-primary">U</AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black truncate">User</h4>
                  <p className="text-xs text-muted-foreground truncate">{msg.text}</p>
               </div>
               <div className="text-[9px] font-black uppercase text-muted-foreground/50">
                 {msg.createdAt && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
            </Link>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 opacity-30 px-10">
            <MessageSquare size={48} className="mx-auto text-primary/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No messages yet</p>
            <p className="text-[9px] font-medium italic">Start a conversation with an innovator!</p>
          </div>
        )}
      </div>
    </div>
  );
}
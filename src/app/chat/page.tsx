
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  // Query messages where user is sender
  const sentMessagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "messages"),
      where("senderId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  // Query messages where user is receiver
  const receivedMessagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: sentMessages } = useCollection(sentMessagesQuery);
  const { data: receivedMessages } = useCollection(receivedMessagesQuery);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Combine and deduplicate conversations to show in Inbox
  const conversationsMap = new Map();
  
  [...(sentMessages || []), ...(receivedMessages || [])].forEach(msg => {
    const otherId = msg.senderId === user?.uid ? msg.receiverId : msg.senderId;
    if (!conversationsMap.has(otherId) || (conversationsMap.get(otherId).createdAt?.seconds || 0) < (msg.createdAt?.seconds || 0)) {
      conversationsMap.set(otherId, msg);
    }
  });

  const uniqueConversations = Array.from(conversationsMap.values()).sort((a, b) => 
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );

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
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6 space-y-3">
        {uniqueConversations.length > 0 ? (
          uniqueConversations.map((conv) => (
            <Link 
              key={conv.id} 
              href={`/chat/${conv.senderId === user?.uid ? conv.receiverId : conv.senderId}`}
              className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-transparent hover:border-primary/20 transition-all"
            >
               <Avatar className="h-12 w-12 border-2 border-background">
                 <AvatarFallback>U</AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0">
                 <h4 className="text-sm font-black text-foreground truncate uppercase">Innovator</h4>
                 <p className="text-[11px] text-muted-foreground truncate font-medium">{conv.text}</p>
               </div>
               <div className="text-right">
                 <span className="text-[9px] font-black text-muted-foreground/50 uppercase">
                    {conv.createdAt ? new Date(conv.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                 </span>
               </div>
            </Link>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 opacity-30 px-10">
            <MessageSquare size={48} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No conversations yet</p>
            <p className="text-[9px] font-medium italic">Start a chat from an innovator's profile!</p>
          </div>
        )}
      </div>
    </div>
  );
}

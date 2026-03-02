"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Phone, Info, Video, Lock, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, addDoc, serverTimestamp, setDoc, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const chatId = params.id as string;

  const recipientId = chatId.split("_").find(id => id !== currentUser?.uid) || "";

  const recipientRef = useMemoFirebase(() => (db && recipientId ? doc(db, "userProfiles", recipientId) : null), [db, recipientId]);
  const { data: recipient, isLoading: isRecipientLoading } = useDoc(recipientRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !chatId) return null;
    return query(
      collection(db, "privateChats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, chatId]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !db || !currentUser || !chatId) return;
    
    const text = newMessage;
    setNewMessage("");

    try {
      await setDoc(doc(db, "privateChats", chatId), {
        chatId: chatId,
        participants: chatId.split("_"),
        lastMessage: text,
        timestamp: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, "privateChats", chatId, "messages"), {
        senderId: currentUser.uid,
        text: text,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Message send failed", e);
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
  };

  if (isRecipientLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarImage src={recipient?.profilePictureUrl} className="object-cover" />
            <AvatarFallback>{recipient?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          {recipient?.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-sm truncate uppercase tracking-tight">@{recipient?.username || "Innovator"}</h2>
          <div className="flex items-center gap-1">
             {recipient?.isOnline ? (
               <span className="text-[8px] text-green-500 font-black uppercase flex items-center gap-1">
                 <Circle size={6} className="fill-current" /> Active Now
               </span>
             ) : (
               <span className="text-[8px] text-muted-foreground font-black uppercase">Offline</span>
             )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full"><Phone size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><Video size={18} /></Button>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-primary/[0.02]"
      >
        <div className="bg-white/50 border border-border/30 p-4 rounded-[2rem] text-center mb-6 max-w-[80%] mx-auto">
           <Lock size={16} className="mx-auto text-primary mb-2 opacity-30" />
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Private Encryption Active</p>
           <p className="text-[8px] text-muted-foreground mt-1 font-medium">Only participants can access this communication channel.</p>
        </div>
        
        {messages?.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex w-full max-w-[85%] flex-col gap-1 animate-in fade-in slide-in-from-bottom-1 duration-300",
                isMe ? "ml-auto items-end" : "items-start"
              )}
            >
              <div 
                className={cn(
                  "px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm",
                  isMe 
                    ? "bg-primary text-white rounded-tr-none shadow-primary/20" 
                    : "bg-white text-foreground rounded-tl-none border border-border/50"
                )}
              >
                {msg.text}
              </div>
              {msg.createdAt && (
                <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                  {new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          );
        })}
        {isMessagesLoading && (
          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary/20" /></div>
        )}
      </div>

      <div className="p-4 bg-white border-t sticky bottom-0 z-50">
        <div className="flex items-center gap-2 bg-muted/30 rounded-[2rem] pl-4 pr-1 py-1 border border-primary/10">
          <Input 
            placeholder="Secure private message..." 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-12 p-0 text-sm font-medium"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon" 
            className="rounded-full h-11 w-11 bg-primary text-white shrink-0 shadow-lg active:scale-95 transition-transform"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, addDoc, serverTimestamp, setDoc, limit, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const chatId = params.id as string;

  // Extract recipientId safely
  const recipientId = chatId.split("_").find(id => id !== currentUser?.uid) || "";

  // Wait for currentUser to be stable before creating references
  const recipientRef = useMemoFirebase(() => (db && recipientId && currentUser ? doc(db, "userProfiles", recipientId) : null), [db, recipientId, currentUser]);
  const { data: recipient, isLoading: isRecipientLoading } = useDoc(recipientRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !chatId || !currentUser) return null;
    return query(
      collection(db, "privateChats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, chatId, currentUser]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (db && currentUser && chatId) {
      const chatRef = doc(db, "privateChats", chatId);
      updateDoc(chatRef, {
        [`unreadCounts.${currentUser.uid}`]: 0
      }).catch(err => console.warn("Failed to clear unread counts", err));
    }
  }, [db, currentUser, chatId, messages?.length]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !db || !currentUser || !chatId || !recipientId) return;
    
    const text = newMessage;
    setNewMessage("");

    try {
      // Create/Update Chat Metadata with participants array and increment recipient unread count
      await setDoc(doc(db, "privateChats", chatId), {
        chatId: chatId,
        participants: chatId.split("_"),
        lastMessage: text,
        timestamp: serverTimestamp(),
        [`unreadCounts.${recipientId}`]: increment(1)
      }, { merge: true });

      // Add actual message
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

  if (isUserLoading || isRecipientLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Final safety check to prevent rendering without auth
  if (!currentUser) return null;

  return (
    <div className="flex flex-col fixed inset-0 max-w-md mx-auto bg-background overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-[60] shrink-0">
        <Link 
          href={`/profile/${recipient?.username}`} 
          className="flex-1 min-w-0 flex items-center gap-3 group hover:opacity-80 transition-opacity"
        >
          <div className="relative shrink-0">
            <Avatar className={cn(
              "h-10 w-10 border-2 border-primary/10 group-hover:border-primary transition-all",
              recipient?.isOnline && "shadow-[0_15px_30px_rgba(255,69,0,0.5)] shadow-primary/50 border-primary"
            )}>
              <AvatarImage src={recipient?.profilePictureUrl} className="object-cover" />
              <AvatarFallback>{recipient?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            {recipient?.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">
              @{recipient?.username || "Innovator"}
            </h2>
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
        </Link>
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

      <div className="shrink-0 p-4 bg-white border-t z-[70] pb-safe">
        <div className="flex items-center gap-2 bg-muted/30 rounded-[2rem] pl-4 pr-1 py-1 border border-primary/10">
          <Input 
            placeholder="Secure private message..." 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-12 p-0 text-sm font-medium"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onFocus={() => {
              setTimeout(scrollToBottom, 300);
            }}
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

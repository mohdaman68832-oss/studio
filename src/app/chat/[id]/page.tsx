
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Phone, Info, Loader2, Video, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const recipientId = params.id as string;

  const recipientRef = useMemoFirebase(() => (db ? doc(db, "userProfiles", recipientId) : null), [db, recipientId]);
  const { data: recipient, isLoading: isRecipientLoading } = useDoc(recipientRef);

  const iFollowRef = useMemoFirebase(() => 
    (db && currentUser && recipientId) ? doc(db, "follows", `${currentUser.uid}_${recipientId}`) : null
  , [db, currentUser, recipientId]);
  
  const followsMeRef = useMemoFirebase(() => 
    (db && currentUser && recipientId) ? doc(db, "follows", `${recipientId}_${currentUser.uid}`) : null
  , [db, currentUser, recipientId]);

  const { data: iFollow } = useDoc(iFollowRef);
  const { data: followsMe } = useDoc(followsMeRef);

  const isMutual = !!iFollow && !!followsMe;

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !currentUser || !recipientId) return null;
    return query(
      collection(db, "messages"),
      where("senderId", "in", [currentUser.uid, recipientId]),
      orderBy("createdAt", "asc"),
      limit(50)
    );
  }, [db, currentUser, recipientId]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  const filteredMessages = firestoreMessages?.filter(m => 
    (m.senderId === currentUser?.uid && m.receiverId === recipientId) ||
    (m.senderId === recipientId && m.receiverId === currentUser?.uid)
  ) || [];

  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  const handleSend = () => {
    if (!newMessage.trim() || !db || !currentUser) return;
    
    addDoc(collection(db, "messages"), {
      senderId: currentUser.uid,
      receiverId: recipientId,
      text: newMessage,
      createdAt: serverTimestamp(),
    });
    
    setNewMessage("");
  };

  const handleCallAttempt = (type: 'voice' | 'video') => {
    if (!isMutual) {
      toast({
        title: "Call Restricted",
        description: "Mutual follow required for calling features.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Calling...",
      description: `Starting a ${type} call with @${recipient?.username}...`
    });
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
        <Avatar className="h-10 w-10">
          <AvatarImage src={recipient?.profilePictureUrl} className="object-cover" />
          <AvatarFallback>{recipient?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-sm truncate uppercase tracking-tight">{recipient?.username || "Innovator"}</h2>
          <div className="flex items-center gap-1">
            <Lock size={8} className="text-green-500" />
            <span className="text-[9px] text-green-500 font-bold uppercase">End-to-End Chat</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("rounded-full", !isMutual && "opacity-40")}
                    onClick={() => handleCallAttempt('voice')}
                  >
                    <Phone size={18} />
                  </Button>
                  {!isMutual && <Lock size={10} className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full p-0.5" />}
                </div>
              </TooltipTrigger>
              {!isMutual && <TooltipContent><p className="text-[10px] font-bold">Mutual follow required</p></TooltipContent>}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("rounded-full", !isMutual && "opacity-40")}
                    onClick={() => handleCallAttempt('video')}
                  >
                    <Video size={18} />
                  </Button>
                  {!isMutual && <Lock size={10} className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full p-0.5" />}
                </div>
              </TooltipTrigger>
              {!isMutual && <TooltipContent><p className="text-[10px] font-bold">Mutual follow required</p></TooltipContent>}
            </Tooltip>
          </TooltipProvider>
          <Button variant="ghost" size="icon" className="rounded-full"><Info size={18} /></Button>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        {!isMutual && (
          <div className="bg-primary/5 border border-primary/10 p-5 rounded-[2rem] text-center mb-6">
             <Lock size={20} className="mx-auto text-primary mb-2 opacity-30" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Restricted Mode</p>
             <p className="text-[9px] text-muted-foreground mt-1 font-medium">Both users must follow each other to enable calling features.</p>
          </div>
        )}
        
        {filteredMessages.map((msg) => {
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
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white text-foreground rounded-tl-none border border-border/50"
                )}
              >
                {msg.text}
              </div>
              {msg.createdAt && (
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                  {new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white border-t sticky bottom-0 z-50">
        <div className="flex items-center gap-2 bg-muted/30 rounded-2xl pl-4 pr-1 py-1 border">
          <Input 
            placeholder="Type a private message..." 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-11 p-0 text-sm font-medium"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon" 
            className="rounded-xl h-10 w-10 bg-primary text-white shrink-0 shadow-md active:scale-95 transition-transform"
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


"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Phone, Info, Loader2, Video, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
}

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const recipientId = params.id as string;

  const recipientRef = useMemoFirebase(() => (db ? doc(db, "userProfiles", recipientId) : null), [db, recipientId]);
  const { data: recipient, isLoading: isRecipientLoading } = useDoc(recipientRef);

  // Check for mutual follow
  const iFollowRef = useMemoFirebase(() => 
    (db && currentUser && recipientId) ? doc(db, "follows", `${currentUser.uid}_${recipientId}`) : null
  , [db, currentUser, recipientId]);
  
  const followsMeRef = useMemoFirebase(() => 
    (db && currentUser && recipientId) ? doc(db, "follows", `${recipientId}_${currentUser.uid}`) : null
  , [db, currentUser, recipientId]);

  const { data: iFollow } = useDoc(iFollowRef);
  const { data: followsMe } = useDoc(followsMeRef);

  const isMutual = !!iFollow && !!followsMe;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "recipient",
      text: "Hi! I saw your post. It's brilliant!",
      timestamp: new Date(Date.now() - 3600000),
      isMe: false,
    }
  ]);

  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text: newMessage,
      timestamp: new Date(),
      isMe: true,
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const handleCall = (type: 'voice' | 'video') => {
    if (!isMutual) {
      toast({
        title: "Call Restricted",
        description: "You can only call users who follow you back.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Initiating Call...",
      description: `Starting a ${type} call with @${recipient?.username}...`
    });
  };

  if (isRecipientLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={recipient?.profilePictureUrl} />
          <AvatarFallback>{recipient?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm truncate">{recipient?.username || "Chat"}</h2>
          <span className="text-[10px] text-green-500 font-medium">Online</span>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("rounded-full", !isMutual && "opacity-40 cursor-not-allowed")}
                    onClick={() => handleCall('voice')}
                  >
                    <Phone size={18} />
                  </Button>
                  {!isMutual && <Lock size={8} className="absolute top-1 right-1 text-red-500" />}
                </div>
              </TooltipTrigger>
              {!isMutual && (
                <TooltipContent>
                  <p className="text-[10px] font-bold uppercase">Mutual follow required</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("rounded-full", !isMutual && "opacity-40 cursor-not-allowed")}
                    onClick={() => handleCall('video')}
                  >
                    <Video size={18} />
                  </Button>
                  {!isMutual && <Lock size={8} className="absolute top-1 right-1 text-red-500" />}
                </div>
              </TooltipTrigger>
              {!isMutual && (
                <TooltipContent>
                  <p className="text-[10px] font-bold uppercase">Mutual follow required</p>
                </TooltipContent>
              )}
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
          <div className="bg-primary/5 border border-primary/10 p-4 rounded-3xl text-center mb-4">
             <Lock size={20} className="mx-auto text-primary mb-2 opacity-30" />
             <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Call Restricted</p>
             <p className="text-[9px] text-muted-foreground mt-1">You must follow each other to enable voice and video calls.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex w-full max-w-[80%] flex-col gap-1",
              msg.isMe ? "ml-auto items-end" : "items-start"
            )}
          >
            <div 
              className={cn(
                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.isMe 
                  ? "bg-primary text-white rounded-tr-none shadow-sm" 
                  : "bg-muted text-foreground rounded-tl-none border"
              )}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-muted-foreground">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="flex items-center gap-2 bg-muted/50 rounded-2xl pl-4 pr-1 py-1">
          <Input 
            placeholder="Type a message..." 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-10 p-0 text-sm"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon" 
            className="rounded-xl h-10 w-10 bg-primary text-white shrink-0 shadow-md"
            onClick={handleSend}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

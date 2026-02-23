
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Phone, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "alex",
      text: "Hi! I saw your EcoConnect idea. It's brilliant!",
      timestamp: new Date(Date.now() - 3600000),
      isMe: false,
    },
    {
      id: "2",
      senderId: "me",
      text: "Thanks Alex! I'm looking for a hardware partner.",
      timestamp: new Date(Date.now() - 3500000),
      isMe: true,
    },
    {
      id: "3",
      senderId: "alex",
      text: "That's perfect. I specialize in smart meter IoT. We should talk about the grid interface.",
      timestamp: new Date(Date.now() - 3400000),
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

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://picsum.photos/seed/user1/100/100" />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm truncate">Alex Rivera</h2>
          <span className="text-[10px] text-green-500 font-medium">Online</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full"><Phone size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><Info size={18} /></Button>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
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

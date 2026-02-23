
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";

const CHATS = [
  {
    id: "1",
    name: "EcoConnect Team",
    lastMessage: "Alex: I've updated the smart grid logic.",
    time: "2m ago",
    unread: 3,
    avatar: "https://picsum.photos/seed/team1/100/100",
    isGroup: true,
  },
  {
    id: "2",
    name: "Sarah Chen",
    lastMessage: "The wearable design looks great!",
    time: "1h ago",
    unread: 0,
    avatar: "https://picsum.photos/seed/user2/100/100",
    isGroup: false,
  },
  {
    id: "3",
    name: "Innovators Lab",
    lastMessage: "Marcus: We need more beta testers.",
    time: "3h ago",
    unread: 1,
    avatar: "https://picsum.photos/seed/team2/100/100",
    isGroup: true,
  },
];

export default function ChatPage() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-6 pb-24">
      <div className="px-6 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Collaborations</h1>
        <button className="bg-primary text-white p-2 rounded-full shadow-lg">
          <Plus size={20} />
        </button>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search messages..." 
            className="pl-10 h-10 bg-muted/50 border-none rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-1">
        {CHATS.map((chat) => (
          <Link 
            key={chat.id} 
            href={`/chat/${chat.id}`}
            className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors border-b last:border-none"
          >
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-background">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              {chat.unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-background">
                  {chat.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm truncate">{chat.name}</h3>
                <span className="text-[10px] text-muted-foreground">{chat.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate leading-relaxed">
                {chat.lastMessage}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {CHATS.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-20 text-muted-foreground px-12 text-center">
          <MessageSquare size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">No active collaborations yet. Start a discussion on an idea!</p>
        </div>
      )}
    </div>
  );
}

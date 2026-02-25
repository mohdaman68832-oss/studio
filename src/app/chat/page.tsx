
"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageSquare, Users, Globe, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const MOCK_CHATS = [
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
  }
];

const MOCK_UNIONS = [
  {
    id: "u1",
    name: "AI Frontiers",
    description: "Building the next generation of neural networks.",
    category: "Technology",
    memberCount: 1240,
    avatar: "https://picsum.photos/seed/ai/100/100",
  },
  {
    id: "u2",
    name: "Green Future Union",
    description: "Collaborative hub for sustainable energy solutions.",
    category: "Sustainability",
    memberCount: 856,
    avatar: "https://picsum.photos/seed/green/100/100",
  },
  {
    id: "u3",
    name: "BioHackers",
    description: "Exploring the intersection of biology and code.",
    category: "Healthcare",
    memberCount: 432,
    avatar: "https://picsum.photos/seed/bio/100/100",
  }
];

export default function ChatPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const db = useFirestore();

  const filteredUnions = useMemo(() => {
    return MOCK_UNIONS.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-6 pb-24">
      <div className="px-6 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Connect</h1>
        <button className="bg-primary text-white p-2 rounded-2xl shadow-lg hover:scale-105 transition-transform">
          <Plus size={20} />
        </button>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search messages or unions..." 
            className="pl-10 h-12 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="w-full bg-transparent border-b rounded-none px-6 h-auto p-0 gap-6">
          <TabsTrigger 
            value="messages" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-xs font-black uppercase tracking-widest"
          >
            Messages
          </TabsTrigger>
          <TabsTrigger 
            value="unions" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-xs font-black uppercase tracking-widest"
          >
            Explore Unions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-2">
          <div className="divide-y divide-border/30">
            {MOCK_CHATS.map((chat) => (
              <Link 
                key={chat.id} 
                href={`/chat/${chat.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-background">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm truncate">{chat.name}</h3>
                    <span className="text-[10px] text-muted-foreground font-medium">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">
                    {chat.lastMessage}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="unions" className="mt-4 px-6 space-y-4">
          <div className="bg-primary/5 p-4 rounded-[2rem] border border-primary/10 mb-6">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Union Spotlight</p>
            <h4 className="text-sm font-bold text-foreground">Global Innovation Unions are open! Join a massive community of like-minded creators.</h4>
          </div>

          <div className="space-y-4">
            {filteredUnions.map((union) => (
              <div 
                key={union.id} 
                className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-border/50 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <Avatar className="h-16 w-16 rounded-3xl border-2 border-primary/5">
                  <AvatarImage src={union.avatar} className="object-cover" />
                  <AvatarFallback className="rounded-3xl bg-primary/10 text-primary font-black">{union.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-sm uppercase tracking-tight truncate">{union.name}</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-1.5 py-0 h-4">
                      {union.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{union.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground">{union.memberCount.toLocaleString()} members</span>
                    </div>
                    <Button size="sm" className="h-7 rounded-full px-4 text-[10px] font-black uppercase tracking-widest shadow-sm">
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredUnions.length === 0 && (
              <div className="py-20 text-center space-y-3 opacity-30">
                <Globe size={48} className="mx-auto" />
                <p className="text-xs font-black uppercase tracking-widest">No Unions found matching your search</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Users, Bell, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

const MOCK_GROUPS = [
  {
    id: "g1",
    name: "AI Frontiers",
    description: "Building the next generation of neural networks.",
    category: "Technology",
    memberCount: 1240,
    avatar: "https://picsum.photos/seed/ai/100/100",
  },
  {
    id: "g2",
    name: "Green Future Hub",
    description: "Collaborative hub for sustainable energy solutions.",
    category: "Sustainability",
    memberCount: 856,
    avatar: "https://picsum.photos/seed/green/100/100",
  }
];

export default function ChatPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const db = useFirestore();
  const { user } = useUser();

  // Fetch notifications with owner filter matching security rules.
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: notifications } = useCollection(notificationsQuery);

  const exploreGroups = useMemo(() => {
    return MOCK_GROUPS.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      g.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const unreadNotificationsCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-6 pb-24">
      <div className="px-6 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Messages</h1>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search discussions..." 
            className="pl-10 h-12 bg-white border-none rounded-2xl shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="w-full bg-transparent border-b rounded-none px-6 h-auto p-0 gap-4 flex overflow-x-auto no-scrollbar">
          <TabsTrigger 
            value="messages" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0"
          >
            <MessageSquare size={14} /> Chats
          </TabsTrigger>
          <TabsTrigger 
            value="groups" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0"
          >
            <Users size={14} /> Groups
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 relative"
          >
            <Bell size={14} /> Discussion Hub
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-secondary text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-black animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-2">
          <div className="py-20 text-center space-y-3 opacity-30">
            <MessageSquare size={48} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest">Direct messages will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="mt-4 px-6 space-y-4">
          <div className="space-y-4">
            {exploreGroups.map((group) => (
              <Link 
                key={group.id} 
                href={`/groups/${group.id}`}
                className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-border/50 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer block"
              >
                <Avatar className="h-16 w-16 rounded-3xl border-2 border-primary/5">
                  <AvatarImage src={group.avatar} className="object-cover" />
                  <AvatarFallback className="rounded-3xl bg-primary/10 text-primary font-black">{group.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-sm uppercase tracking-tight truncate">{group.name}</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-1.5 py-0 h-4">
                      {group.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground">{group.memberCount.toLocaleString()} members</span>
                    </div>
                    <Button size="sm" className="h-7 rounded-full px-4 text-[10px] font-black uppercase tracking-widest shadow-sm">
                      Join
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-2">
          <div className="divide-y divide-border/30">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={`/idea/${notif.ideaId}`}
                  className={cn(
                    "flex items-start gap-4 px-6 py-5 hover:bg-white/50 transition-colors",
                    !notif.read && "bg-primary/5"
                  )}
                >
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm shrink-0">
                    <AvatarImage src={notif.fromUserAvatar} />
                    <AvatarFallback>{notif.fromUserName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[12px] leading-tight text-foreground/90">
                      <span className="font-black text-primary uppercase text-[10px] mr-1">@{notif.fromUserName?.toLowerCase().replace(/\s/g, '')}</span>
                      discussed your idea: <span className="font-black text-foreground">"{notif.ideaTitle}"</span>
                    </p>
                    <div className="mt-2 bg-white/50 p-2.5 rounded-2xl border border-border/30">
                      <p className="text-[11px] italic text-muted-foreground line-clamp-2">"{notif.text}"</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-2">
                      {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-1" />
                </Link>
              ))
            ) : (
              <div className="py-24 text-center space-y-4 opacity-30 px-10">
                <Bell size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Activity feed is empty</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

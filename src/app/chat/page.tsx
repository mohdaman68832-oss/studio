
"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Users, Bell, ChevronRight, Lock } from "lucide-react";
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

  // Fetch notifications
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: notifications } = useCollection(notificationsQuery);

  // Fetch recent messages to find conversation partners
  const recentMessagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: recentMessages } = useCollection(recentMessagesQuery);

  const exploreGroups = useMemo(() => {
    return MOCK_GROUPS.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      g.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const unreadNotificationsCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24">
      <div className="px-6 mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Innovations</h1>
      </div>

      <div className="px-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search discussions..." 
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="w-full bg-transparent border-b rounded-none px-6 h-auto p-0 gap-6 flex overflow-x-auto no-scrollbar">
          <TabsTrigger 
            value="messages" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shrink-0"
          >
            <MessageSquare size={14} /> Chats
          </TabsTrigger>
          <TabsTrigger 
            value="groups" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shrink-0"
          >
            <Users size={14} /> Groups
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shrink-0 relative"
          >
            <Bell size={14} /> Alerts
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 -right-3 bg-secondary text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-black animate-pulse shadow-sm shadow-secondary/50">
                {unreadNotificationsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-2">
          {recentMessages && recentMessages.length > 0 ? (
            <div className="divide-y divide-border/30">
              {/* Unique conversation partners can be filtered here */}
              <p className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Recent Conversations</p>
              {recentMessages.map((msg) => (
                <Link 
                  key={msg.id} 
                  href={`/chat/${msg.senderId}`}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-white transition-colors"
                >
                  <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                    <AvatarFallback className="bg-primary/5 text-primary font-black uppercase">{msg.senderId[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate">Direct Message</h3>
                    <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">{msg.text}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-4 opacity-30 px-10">
              <MessageSquare size={48} className="mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Start a direct message from an innovator's profile</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-4 px-6 space-y-4">
          <div className="space-y-4">
            {exploreGroups.map((group) => (
              <Link 
                key={group.id} 
                href={`/groups/${group.id}`}
                className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-border/50 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer block"
              >
                <Avatar className="h-16 w-16 rounded-3xl border-2 border-primary/5 shadow-sm">
                  <AvatarImage src={group.avatar} className="object-cover" />
                  <AvatarFallback className="rounded-3xl bg-primary/10 text-primary font-black uppercase">{group.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-sm uppercase tracking-tight truncate text-foreground">{group.name}</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 py-0.5 h-auto">
                      {group.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2 font-medium">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-primary" />
                      <span className="text-[10px] font-black text-muted-foreground/60">{group.memberCount.toLocaleString()} MEMBERS</span>
                    </div>
                    <Button size="sm" className="h-8 rounded-full px-5 text-[9px] font-black uppercase tracking-widest shadow-md">
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
                    "flex items-start gap-4 px-6 py-6 hover:bg-white transition-colors",
                    !notif.read && "bg-primary/5"
                  )}
                >
                  <Avatar className="h-12 w-12 border-2 border-background shadow-md shrink-0">
                    <AvatarImage src={notif.fromUserAvatar} className="object-cover" />
                    <AvatarFallback className="font-black uppercase text-xs">{notif.fromUserName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[12px] leading-tight text-foreground/90 font-medium">
                      <span className="font-black text-primary uppercase text-[10px] mr-1.5 tracking-tight">@{notif.fromUserName?.toLowerCase().replace(/\s/g, '')}</span>
                      discussed your idea: <span className="font-black text-foreground">"{notif.ideaTitle}"</span>
                    </p>
                    <div className="mt-3 bg-white p-3 rounded-2xl border border-border/50 shadow-sm italic">
                      <p className="text-[11px] text-muted-foreground line-clamp-2">"{notif.text}"</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-3 opacity-60">
                      {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-1.5" />
                </Link>
              ))
            ) : (
              <div className="py-24 text-center space-y-4 opacity-30 px-10">
                <Bell size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Your activity feed is empty</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

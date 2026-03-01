"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Bell, Globe, Loader2, Plus, MessageCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HubPage() {
  const { user, loading: isUserLoading } = useUser();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  // Notifications Query
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: notifications, isLoading: isNotificationsLoading } = useCollection(notificationsQuery);

  // Groups/Unions Query
  const groupsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "groups"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db]);

  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return (
    <div className="flex h-screen items-center justify-center bg-background p-10 text-center">
      <p className="text-sm font-black uppercase text-muted-foreground">Please sign in to access the hub.</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24">
      <div className="px-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">The Hub</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Groups & Alerts</p>
        </div>
        <Link href="/groups/create">
          <Button size="sm" className="rounded-full h-10 px-5 bg-secondary text-white shadow-lg shadow-secondary/20 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Plus size={14} /> Form Group
          </Button>
        </Link>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search hub..." 
            className="pl-12 h-14 bg-card border-none rounded-3xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <div className="px-6 mb-6">
          <TabsList className="w-full h-12 bg-muted/30 rounded-full p-1 grid grid-cols-2">
            <TabsTrigger value="notifications" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              <Bell size={14} className="mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              <Globe size={14} className="mr-2" /> Groups
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notifications" className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {isNotificationsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <Link key={notif.id} href={notif.type === 'newComment' ? `/idea/${notif.sourceId}` : '#'}>
                <div className={cn(
                  "flex items-start gap-4 p-4 rounded-[2rem] border shadow-sm transition-all bg-card mb-4",
                  notif.isRead ? "border-border/30 opacity-60" : "border-primary/20 shadow-primary/5 hover:border-primary/40"
                )}>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {notif.type === 'newComment' ? (
                      <MessageCircle size={18} className="text-primary" />
                    ) : (
                      <Bell size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground leading-snug">{notif.message}</p>
                    <p className="text-[9px] text-muted-foreground font-black uppercase mt-1">
                      {notif.createdAt && new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-24 text-center space-y-4 opacity-30">
              <Bell size={48} className="mx-auto text-primary/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Alerts</p>
              <p className="text-[9px] font-medium italic px-10">Stay active to receive notifications.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {isGroupsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : groups && groups.length > 0 ? (
            groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="flex items-center gap-4 bg-card p-4 rounded-[2.5rem] border border-border/50 shadow-sm hover:border-primary transition-all">
                <Avatar className="h-14 w-14 rounded-[1.5rem] border-2 border-background shadow-md">
                  <AvatarImage src={group.avatarUrl} className="object-cover" />
                  <AvatarFallback className="font-black bg-primary/10 text-primary uppercase">{group.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-black truncate uppercase tracking-tighter">{group.name}</h4>
                    <Badge variant="secondary" className="text-[8px] font-black bg-secondary/10 text-secondary border-none">{group.category}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate font-medium">{group.description}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-24 text-center space-y-4 opacity-30">
              <Globe size={48} className="mx-auto text-primary/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">World Empty</p>
              <p className="text-[9px] font-medium italic px-10">Create or join a group to start collaborating.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

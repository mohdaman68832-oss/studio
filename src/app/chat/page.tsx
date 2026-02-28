
"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, ChevronRight, Bell, Clock } from "lucide-react";
import Link from "next/link";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChatPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const db = useFirestore();

  const myMessagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // We fetch messages where the user is either sender or receiver
    return query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, user]);

  const { data: allMessages, isLoading: messagesLoading } = useCollection(myMessagesQuery);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: notifications, isLoading: notifsLoading } = useCollection(notificationsQuery);

  const uniqueConversations = useMemo(() => {
    if (!allMessages || !user) return [];
    
    const map = new Map();
    const filteredMessages = allMessages.filter(m => m.senderId === user.uid || m.receiverId === user.uid);

    filteredMessages.forEach(msg => {
      const otherId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
      
      if (!map.has(otherId)) {
        map.set(otherId, {
          ...msg,
          partnerId: otherId,
          isOnline: Math.random() > 0.4 // Simulated for visual indicator
        });
      }
    });

    return Array.from(map.values()).filter(conv => 
       conv.partnerId.toLowerCase().includes(searchQuery.toLowerCase()) || 
       conv.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allMessages, user, searchQuery]);

  const markAsRead = async (notifId: string) => {
    if (!db) return;
    const ref = doc(db, "notifications", notifId);
    updateDoc(ref, { read: true });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24">
      <div className="px-6 mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Inbox</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Connect & Collaborate</p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <div className="px-6 mb-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 p-1">
            <TabsTrigger value="messages" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">
              Messages
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary flex items-center gap-2">
              Notifications
              {notifications?.some(n => !n.read) && (
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="messages" className="mt-0 space-y-8">
          <div className="px-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search messages..." 
                className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            {uniqueConversations.length > 0 ? (
              <div className="divide-y divide-border/30">
                {uniqueConversations.map((msg) => (
                  <Link 
                    key={msg.id} 
                    href={`/chat/${msg.partnerId}`}
                    className="flex items-center gap-4 px-6 py-5 hover:bg-white transition-colors"
                  >
                    <div className="relative">
                      <Avatar className={cn(
                        "h-14 w-14 border-2 transition-all duration-300",
                        msg.isOnline ? "border-green-500 ring-4 ring-green-500/20" : "border-transparent"
                      )}>
                        <AvatarFallback className="bg-primary/5 text-primary font-black uppercase">{msg.partnerId[0]}</AvatarFallback>
                      </Avatar>
                      {msg.isOnline && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate">@{msg.partnerId.substring(0, 8)}</h3>
                        {msg.isOnline && <span className="text-[8px] text-green-500 font-bold uppercase tracking-widest">Active</span>}
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">{msg.text}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center space-y-4 opacity-30 px-10">
                {messagesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 w-full bg-muted rounded-2xl" />)}
                  </div>
                ) : (
                  <>
                    <MessageSquare size={48} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No messages yet</p>
                  </>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 space-y-1">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={`/idea/${notif.ideaId}`}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    "flex items-start gap-4 px-6 py-5 hover:bg-white transition-colors",
                    !notif.read && "bg-primary/5 border-l-4 border-l-primary"
                  )}
                >
                  <Avatar className="h-12 w-12 rounded-2xl border shadow-sm">
                    <AvatarImage src={notif.fromUserAvatar} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">{notif.fromUserName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary">New Suggestion</p>
                       {notif.createdAt && (
                         <div className="flex items-center gap-1 opacity-40">
                            <Clock size={10} />
                            <span className="text-[8px] font-bold uppercase">Recent</span>
                         </div>
                       )}
                    </div>
                    <p className="text-[12px] font-medium leading-relaxed">
                      <span className="font-black text-foreground">@{notif.fromUserName}</span> commented on 
                      <span className="text-primary font-bold mx-1">"{notif.ideaTitle}"</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 bg-muted/30 p-2 rounded-xl border italic">
                      "{notif.text}"
                    </p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 self-center" />}
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center space-y-4 opacity-30 px-10">
               {notifsLoading ? (
                 <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 w-full bg-muted rounded-2xl" />)}
                 </div>
               ) : (
                 <>
                   <Bell size={48} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">No notifications yet</p>
                 </>
               )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

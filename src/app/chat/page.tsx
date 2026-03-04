
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Bell, Globe, Loader2, Plus, MessageCircle, UserPlus, RefreshCcw, ShieldAlert, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, where, getDocs, Timestamp, doc } from "firebase/firestore";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function ChatRecipientInfo({ recipientId, lastMessage, timestamp, unreadCount }: { recipientId: string, lastMessage: string, timestamp: any, unreadCount: number }) {
  const db = useFirestore();
  const recipientRef = useMemoFirebase(() => (db && recipientId ? doc(db, "userProfiles", recipientId) : null), [db, recipientId]);
  const { data: recipient, isLoading } = useDoc(recipientRef);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 py-4 animate-pulse">
        <div className="h-14 w-14 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const timeString = timestamp instanceof Timestamp 
    ? timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : "New";

  return (
    <div className="flex items-center gap-4 py-4 w-full">
      {/* Avatar Section */}
      <div className="relative shrink-0">
        <Avatar className={cn(
          "h-14 w-14 border-2 border-primary/5 shadow-sm transition-all",
          recipient?.isOnline && "shadow-[0_0_15px_rgba(255,69,0,0.4)] shadow-primary/40 border-primary"
        )}>
          <AvatarImage src={recipient?.profilePictureUrl} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary text-sm font-black uppercase">
            {recipient?.username?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        {recipient?.isOnline && (
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-14">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className="text-[15px] font-bold text-foreground truncate">
            {recipient?.name || `@${recipient?.username}`}
          </h4>
          <span className="text-[11px] text-muted-foreground font-medium uppercase">
            {timeString}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-[13px] text-muted-foreground truncate font-medium max-w-[85%]">
            {lastMessage || "Start a conversation..."}
          </p>
          
          {/* Unread Count Badge - Only show if > 0 */}
          {unreadCount > 0 && (
            <div className="h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-primary text-white text-[10px] font-black rounded-full shadow-lg shadow-primary/20 animate-in zoom-in duration-300">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HubPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [useSimpleQuery, setUseSimpleQuery] = useState(false);

  const privateChatsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    const colRef = collection(db, "privateChats");
    
    if (useSimpleQuery) {
      return query(
        colRef,
        where("participants", "array-contains", user.uid)
      );
    }

    return query(
      colRef,
      where("participants", "array-contains", user.uid),
      orderBy("timestamp", "desc")
    );
  }, [db, user?.uid, useSimpleQuery]);

  const { data: privateChats, isLoading: isPrivateLoading, error: privateError } = useCollection(privateChatsQuery);

  const isIndexBuilding = privateError?.message.toLowerCase().includes('building');

  const handleUserSearch = async () => {
    if (!searchQuery.trim() || !db) return;
    setIsSearchingUsers(true);
    try {
      const searchStr = searchQuery.toLowerCase().trim();
      const q = query(
        collection(db, "userProfiles"),
        where("username", ">=", searchStr),
        where("username", "<=", searchStr + "\uf8ff"),
        limit(5)
      );
      const snap = await getDocs(q);
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== user?.uid);
      setUserSearchResults(results);
    } catch (e) {
      console.error("User search failed", e);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const startChat = (recipientId: string) => {
    if (!user) return;
    const chatId = [user.uid, recipientId].sort().join("_");
    router.push(`/chat/${chatId}`);
  };

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
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24 flex flex-col">
      <div className="px-6 mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">The Hub</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Encrypted Sphere</p>
      </div>

      <div className="px-6 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search @username..." 
              className="pl-12 h-14 bg-card border-none rounded-3xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
            />
          </div>
          <Button onClick={handleUserSearch} size="icon" className="h-14 w-14 rounded-3xl bg-primary shadow-xl">
            {isSearchingUsers ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
          </Button>
        </div>

        {userSearchResults.length > 0 && (
          <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground ml-2">Innovators Found</p>
            {userSearchResults.map(u => (
              <div 
                key={u.id} 
                onClick={() => startChat(u.id)}
                className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-primary/10 hover:border-primary cursor-pointer transition-all shadow-sm group"
              >
                <Link href={`/profile/${u.username}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar className={cn(
                    "h-10 w-10 border-2 border-transparent group-hover:border-primary transition-all",
                    u.isOnline && "shadow-[0_0_15px_rgba(255,69,0,0.4)] shadow-primary/40 border-primary"
                  )}>
                    <AvatarImage src={u.profilePictureUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-tight">@{u.username}</p>
                </div>
                <MessageCircle size={18} className="text-primary mr-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="private" className="w-full flex-1 flex flex-col overflow-hidden">
        <div className="px-6 mb-2">
          <TabsList className="w-full h-12 bg-muted/30 rounded-full p-1 grid grid-cols-3">
            <TabsTrigger value="private" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <MessageCircle size={14} className="mr-2" /> Chats
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Bell size={14} className="mr-2" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Globe size={14} className="mr-2" /> Groups
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="private" className="flex-1 overflow-y-auto outline-none no-scrollbar">
          {isPrivateLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Decrypting Chats...</p>
            </div>
          ) : isIndexBuilding ? (
            <div className="py-12 text-center space-y-6 flex flex-col items-center mx-6 animate-in fade-in">
              <RefreshCcw size={48} className="text-blue-500 animate-spin" />
              <div className="space-y-2">
                <p className="text-sm font-black uppercase text-blue-600 tracking-tighter">Index Building...</p>
                <p className="text-[10px] font-medium text-blue-500 px-10 leading-relaxed uppercase">
                  Firestore is currently constructing your composite index.
                </p>
              </div>
              <Button 
                onClick={() => setUseSimpleQuery(true)} 
                variant="outline"
                className="rounded-full h-10 border-blue-200 text-blue-600 font-black uppercase text-[9px] tracking-widest"
              >
                Simple Fetch (No Sorting)
              </Button>
            </div>
          ) : privateError ? (
             <div className="py-8 text-center space-y-6 flex flex-col items-center mx-6 animate-in fade-in">
              <ShieldAlert size={40} className="text-primary animate-pulse" />
              <div className="space-y-2">
                <p className="text-sm font-black uppercase text-primary tracking-tighter px-4">Index Required</p>
                <p className="text-[10px] font-medium text-muted-foreground px-8 leading-relaxed uppercase">
                  A Composite Index is missing for sorted private chats.
                </p>
              </div>
              
              <div className="w-full space-y-3">
                <div className="bg-white p-4 rounded-2xl border border-primary/20 text-left shadow-sm">
                   <p className="text-[9px] font-black uppercase text-primary mb-2 flex items-center gap-2">
                     <AlertCircle size={12} /> Index Settings
                   </p>
                   <div className="space-y-1.5 border-t pt-2 border-primary/5 mt-2">
                      <div className="flex justify-between items-center bg-muted/20 p-1.5 rounded-lg">
                        <span className="text-[8px] font-bold">Collection</span>
                        <span className="text-[8px] font-black text-primary">privateChats</span>
                      </div>
                      <div className="flex justify-between items-center bg-primary/10 p-1.5 rounded-lg border border-primary/20">
                        <span className="text-[8px] font-bold">Scope</span>
                        <span className="text-[8px] font-black text-primary">Collection</span>
                      </div>
                      <div className="flex justify-between items-center bg-muted/20 p-1.5 rounded-lg">
                        <span className="text-[8px] font-bold">Field 1</span>
                        <span className="text-[8px] font-black text-primary">participants (Arrays)</span>
                      </div>
                      <div className="flex justify-between items-center bg-muted/20 p-1.5 rounded-lg">
                        <span className="text-[8px] font-bold">Field 2</span>
                        <span className="text-[8px] font-black text-primary">timestamp (Descending)</span>
                      </div>
                   </div>
                </div>
              </div>

              <Button 
                onClick={() => setUseSimpleQuery(true)} 
                variant="outline"
                className="w-full rounded-full h-12 border-primary text-primary font-black uppercase text-[10px] tracking-widest shadow-sm"
              >
                Fetch without Sorting (Debug)
              </Button>
            </div>
          ) : privateChats && privateChats.length > 0 ? (
            <div className="divide-y divide-border/50">
              {useSimpleQuery && (
                <div className="bg-secondary/10 px-6 py-3 border-b border-secondary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-secondary" />
                    <p className="text-[9px] font-black uppercase text-secondary">Simple Fetch Active</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setUseSimpleQuery(false)} className="h-6 text-[8px] uppercase font-black">Enable Sorting</Button>
                </div>
              )}
              {privateChats.map((chat) => {
                const recipientId = chat.participants?.find((id: string) => id !== user.uid);
                if (!recipientId) return null;
                const unreadCount = chat.unreadCounts?.[user.uid] || 0;
                return (
                  <Link key={chat.id} href={`/chat/${chat.id}`} className="block px-6 hover:bg-muted/30 transition-colors active:bg-muted/50">
                    <ChatRecipientInfo 
                      recipientId={recipientId} 
                      lastMessage={chat.lastMessage} 
                      timestamp={chat.timestamp}
                      unreadCount={unreadCount}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
              <MessageCircle size={48} className="text-primary/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Hub Empty</p>
              <p className="text-[9px] font-medium italic px-10 text-muted-foreground text-center">Start a conversation with innovators.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="flex-1 overflow-y-auto px-6 space-y-4 outline-none">
          <div className="py-24 text-center opacity-30">
             <Bell size={48} className="mx-auto mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest">No Alerts</p>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="flex-1 overflow-y-auto px-6 space-y-6 outline-none">
          <div className="flex justify-between items-center pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Communities</p>
            <Link href="/groups/create">
              <Button size="sm" className="rounded-full h-9 px-5 bg-secondary text-white shadow-lg shadow-secondary/20 font-black uppercase text-[9px] tracking-widest flex items-center gap-2">
                <Plus size={14} /> New Group
              </Button>
            </Link>
          </div>
          
          <div className="py-24 text-center opacity-30">
            <Globe size={48} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Discovering Groups...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

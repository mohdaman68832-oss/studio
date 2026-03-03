"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Bell, Globe, Loader2, Plus, MessageCircle, UserPlus } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, where, getDocs, Timestamp, doc } from "firebase/firestore";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function ChatRecipientInfo({ recipientId, lastMessage, timestamp }: { recipientId: string, lastMessage: string, timestamp: any }) {
  const db = useFirestore();
  const recipientRef = useMemoFirebase(() => (db && recipientId ? doc(db, "userProfiles", recipientId) : null), [db, recipientId]);
  const { data: recipient, isLoading } = useDoc(recipientRef);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-2 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 border border-primary/10">
          <AvatarImage src={recipient?.profilePictureUrl} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary text-xs font-black uppercase">
            {recipient?.username?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        {recipient?.isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="text-sm font-black truncate uppercase tracking-tighter text-foreground">
            @{recipient?.username || "Innovator"}
          </h4>
          <p className="text-[8px] text-muted-foreground font-black uppercase shrink-0">
            {timestamp instanceof Timestamp ? timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "New"}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground truncate font-medium">
          {lastMessage || "Start a conversation..."}
        </p>
      </div>
    </div>
  );
}

export default function HubPage() {
  const { user, loading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Optimized query for Hub Feed - strictly matches composite index: participants (array-contains) + timestamp (desc)
  const privateChatsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "privateChats"),
      where("participants", "array-contains", user.uid),
      orderBy("timestamp", "desc")
    );
  }, [db, user?.uid]);

  const { data: privateChats, isLoading: isPrivateLoading, error: privateError } = useCollection(privateChatsQuery);

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
      <div className="px-6 mb-8 flex justify-between items-end border-b pb-4 border-primary/5">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">The Hub</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Secure Messaging</p>
        </div>
        <Link href="/groups/create">
          <Button size="sm" className="rounded-full h-10 px-5 bg-secondary text-white shadow-lg shadow-secondary/20 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Plus size={14} /> Group
          </Button>
        </Link>
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
                className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-primary/10 hover:border-primary cursor-pointer transition-all shadow-sm"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.profilePictureUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
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
        <div className="px-6 mb-6">
          <TabsList className="w-full h-12 bg-muted/30 rounded-full p-1 grid grid-cols-3">
            <TabsTrigger value="private" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <MessageCircle size={14} className="mr-2" /> Chats
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Bell size={14} className="mr-2" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Globe size={14} className="mr-2" /> Unions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="private" className="flex-1 overflow-y-auto px-6 space-y-4 outline-none no-scrollbar">
          {isPrivateLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Decrypting Chats...</p>
            </div>
          ) : privateError ? (
             <div className="py-24 text-center space-y-4 flex flex-col items-center">
              <p className="text-[10px] font-black uppercase text-destructive">Communication Hub Syncing</p>
              <p className="text-[9px] font-medium italic px-10 text-muted-foreground text-center">
                {privateError.message.includes('index') 
                  ? "The innovation sphere is still stabilizing after the new index update. Please refresh in a moment."
                  : "Syncing your secure communication channels. Please ensure you have a stable connection."}
              </p>
            </div>
          ) : privateChats && privateChats.length > 0 ? (
            privateChats.map((chat) => {
              const recipientId = chat.participants?.find((id: string) => id !== user.uid);
              if (!recipientId) return null;
              return (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <div className="bg-card p-5 rounded-[2.5rem] border border-border/50 shadow-md hover:border-primary transition-all group active:scale-[0.98]">
                    <ChatRecipientInfo 
                      recipientId={recipientId} 
                      lastMessage={chat.lastMessage} 
                      timestamp={chat.timestamp} 
                    />
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
              <MessageCircle size={48} className="text-primary/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Communication Hub Empty</p>
              <p className="text-[9px] font-medium italic px-10 text-muted-foreground text-center">Use the search bar above to connect with other innovators.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="flex-1 overflow-y-auto px-6 space-y-4 outline-none">
          <div className="py-24 text-center opacity-30">
             <Bell size={48} className="mx-auto mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest">No Alerts Received</p>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="flex-1 overflow-y-auto px-6 space-y-4 outline-none">
          <div className="py-24 text-center opacity-30">
            <Globe size={48} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Global Discovery Coming Soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

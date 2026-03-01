
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-8 pb-24">
      <div className="px-6 mb-8">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Inbox</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Connect with Innovators</p>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search innovators..." 
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6 space-y-3">
        <div className="py-24 text-center space-y-4 opacity-30 px-10">
          <MessageSquare size={48} className="mx-auto text-primary/30" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Messaging is temporarily paused</p>
          <p className="text-[9px] font-medium italic">We're updating our security layers. Check back soon!</p>
        </div>
      </div>
    </div>
  );
}

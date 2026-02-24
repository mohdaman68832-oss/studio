
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useCollection, useFirestore } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Sparkles, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const db = useFirestore();

  const [commentText, setCommentText] = useState("");

  const ideaRef = useMemo(() => (db ? doc(db, "ideas", ideaId) : null), [db, ideaId]);
  const { data: idea, loading: ideaLoading } = useDoc(ideaRef);

  const suggestionsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "ideas", ideaId, "suggestions"),
      orderBy("createdAt", "desc")
    );
  }, [db, ideaId]);

  const { data: suggestions, loading: suggestionsLoading } = useCollection(suggestionsQuery);

  const handlePostSuggestion = () => {
    if (!commentText.trim() || !db) return;

    addDoc(collection(db, "ideas", ideaId, "suggestions"), {
      text: commentText,
      userName: "Guest Innovator",
      userAvatar: "https://picsum.photos/seed/guest/100/100",
      createdAt: serverTimestamp(),
    });

    setCommentText("");
  };

  if (ideaLoading) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!idea && !ideaLoading) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Idea not found</p>
        <Button onClick={() => router.push("/")} className="rounded-full">Go Back Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <h1 className="font-black text-sm uppercase tracking-tighter truncate">{idea?.title}</h1>
      </header>

      <div className="p-4 space-y-6">
        <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden border shadow-xl">
          <Image src={idea?.mediaUrl || "https://picsum.photos/seed/placeholder/800/800"} alt={idea?.title} fill className="object-cover" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary/90 text-white border-none backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <Sparkles size={12} className="fill-current" />
              <span className="text-[10px] font-black uppercase tracking-wider">Live Suggestion Hub</span>
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarImage src={idea?.userAvatar} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-black text-foreground">{idea?.userName}</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{idea?.category}</p>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            {idea?.description}
          </p>
        </div>

        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Real-time Suggestions</span>
             <Separator className="flex-1 opacity-50" />
          </div>

          <div className="space-y-4">
            {suggestions?.map((suggestion) => (
              <div key={suggestion.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-500">
                <Avatar className="h-8 w-8 border border-muted/50 shadow-sm">
                  <AvatarImage src={suggestion.userAvatar} />
                  <AvatarFallback>{suggestion.userName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-white p-4 rounded-3xl rounded-tl-none border border-border/50 shadow-sm">
                  <p className="text-[12px] leading-relaxed text-foreground/90">
                      <span className="font-black text-primary mr-1.5 uppercase text-[10px]">
                        {suggestion.userName.toLowerCase().replace(/\s/g, '')}
                      </span>
                      {suggestion.text}
                  </p>
                </div>
              </div>
            ))}

            {suggestions?.length === 0 && !suggestionsLoading && (
              <div className="py-12 text-center space-y-2 opacity-30">
                <Lightbulb size={32} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">No suggestions yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-30">
        <div className="max-w-md mx-auto flex items-center gap-3 bg-white p-2 rounded-3xl border border-primary/20 shadow-lg">
          <Avatar className="h-10 w-10 shadow-sm shrink-0">
            <AvatarImage src="https://picsum.photos/seed/me/100/100" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center pr-1">
            <Input 
              placeholder="Post a live suggestion..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 shadow-none text-xs h-10 px-0 placeholder:text-muted-foreground/60 font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handlePostSuggestion()}
            />
            <Button 
              size="icon"
              className="rounded-2xl h-10 w-10 bg-primary text-white shrink-0"
              onClick={handlePostSuggestion}
              disabled={!commentText.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

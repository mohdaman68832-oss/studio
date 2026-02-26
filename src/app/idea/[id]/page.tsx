
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Sparkles, Lightbulb, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MOCK_IDEAS = [
  {
    id: "1",
    title: "EcoConnect: Smart Grid for Neighborhoods",
    problem: "Rising energy costs and inefficient localized energy distribution.",
    description: "A decentralized platform enabling neighbors to share excess solar energy with zero transaction fees using blockchain technology.",
    category: "Sustainability",
    userName: "Alex Rivera",
    userAvatar: "https://picsum.photos/seed/user1/100/100",
    mediaUrl: "https://picsum.photos/seed/tech/800/600",
    innovationScore: 92,
  },
  {
    id: "2",
    title: "NeuroFocus: AI-Driven ADHD Support",
    problem: "Difficulty maintaining concentration during complex work tasks.",
    description: "Wearable device that monitors focus levels and provides subtle haptic feedback to help individuals with ADHD maintain deep work states.",
    category: "Healthcare",
    userName: "Sarah Chen",
    userAvatar: "https://picsum.photos/seed/user2/100/100",
    mediaUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    innovationScore: 88,
  },
  {
    id: "3",
    title: "Aura: Personal Air Purifier",
    problem: "High levels of urban air pollution affecting daily respiratory health.",
    description: "Stylish, portable neck-worn air purifier using ionized filtration to create a clean air bubble around the user in polluted urban areas.",
    category: "Technology",
    userName: "Marcus Vane",
    userAvatar: "https://picsum.photos/seed/user3/100/100",
    mediaUrl: "https://picsum.photos/seed/textpost/800/800",
    innovationScore: 76,
  }
];

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const db = useFirestore();

  const [commentText, setCommentText] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const ideaRef = useMemoFirebase(() => (db ? doc(db, "ideas", ideaId) : null), [db, ideaId]);
  const { data: firestoreIdea, isLoading: ideaLoading } = useDoc(ideaRef);

  const idea = useMemo(() => {
    if (firestoreIdea) return firestoreIdea;
    return MOCK_IDEAS.find(i => i.id === ideaId);
  }, [firestoreIdea, ideaId]);

  const suggestionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "ideas", ideaId, "suggestions"),
      orderBy("createdAt", "asc")
    );
  }, [db, ideaId]);

  const { data: suggestions, isLoading: suggestionsLoading } = useCollection(suggestionsQuery);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [suggestions]);

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

  if (ideaLoading && !idea) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Idea not found</p>
        <Button onClick={() => router.push("/")} className="rounded-full">Go Back Home</Button>
      </div>
    );
  }

  const isVideo = idea?.mediaUrl && (idea?.mediaUrl?.includes('blob:') || idea?.mediaUrl?.endsWith('.mp4') || idea?.mediaUrl?.endsWith('.webm') || idea?.mediaUrl?.includes('gtv-videos-bucket'));
  const isTextPost = !idea?.mediaUrl || idea?.mediaUrl?.includes('textpost') || idea?.mediaUrl === "";

  return (
    <div className="max-w-md mx-auto h-screen bg-background flex flex-col">
      <header className="shrink-0 z-20 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-sm uppercase tracking-tighter truncate">{idea?.title}</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mt-1">Live Suggestion Hub</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar" ref={scrollContainerRef}>
        <div className="p-4 space-y-6 pb-24">
          {!isTextPost && (
            <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border shadow-xl bg-black">
              {isVideo ? (
                <video src={idea?.mediaUrl} controls autoPlay muted className="w-full h-full object-contain" />
              ) : (
                <Image src={idea?.mediaUrl || "https://picsum.photos/seed/placeholder/800/800"} alt={idea?.title} fill className="object-cover" />
              )}
              <div className="absolute top-4 right-4">
                <Badge className="bg-secondary/90 text-white border-none backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                  <Sparkles size={12} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{idea?.innovationScore}</span>
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-4 bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-border/50">
            <div className="flex items-center justify-between">
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
              {isTextPost && (
                <Badge className="bg-secondary/90 text-white border-none rounded-full px-3 py-1 flex items-center gap-1.5">
                  <Sparkles size={12} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{idea?.innovationScore}</span>
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-primary uppercase tracking-tighter leading-tight">{idea?.title}</h2>
              <div className="space-y-1 mt-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">The Challenge</p>
                <p className="text-sm text-foreground/80 font-bold leading-relaxed">{idea?.problem}</p>
              </div>

              {isTextPost || showFullDescription ? (
                <div className="mt-4 pt-4 border-t border-muted animate-in fade-in slide-in-from-top-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2">Detailed Brief</p>
                  <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                    {idea?.description}
                  </p>
                </div>
              ) : null}

              {!isTextPost && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2 h-auto p-0 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-transparent"
                >
                  {showFullDescription ? (
                    <span className="flex items-center gap-1">Show Less <ChevronUp size={12} /></span>
                  ) : (
                    <span className="flex items-center gap-1">See Full Description <ChevronDown size={12} /></span>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                 <MessageCircle size={14} /> Live Feedback
               </span>
               <Separator className="flex-1 opacity-50" />
            </div>

            <div className="space-y-4">
              {suggestions?.map((suggestion) => (
                <div key={suggestion.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Avatar className="h-8 w-8 border border-muted/50 shadow-sm shrink-0">
                    <AvatarImage src={suggestion.userAvatar} />
                    <AvatarFallback>{suggestion.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-white p-3.5 rounded-2xl rounded-tl-none border border-border/50 shadow-sm">
                    <p className="text-[12px] leading-relaxed text-foreground/90">
                        <span className="font-black text-primary mr-1.5 uppercase text-[9px]">
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
                  <p className="text-[10px] font-black uppercase tracking-widest">No live suggestions yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-4 bg-background/80 backdrop-blur-md border-t z-30">
        <div className="max-w-md mx-auto flex items-center gap-3 bg-white p-2 rounded-3xl border border-primary/20 shadow-lg">
          <Avatar className="h-10 w-10 shadow-sm shrink-0">
            <AvatarImage src="https://picsum.photos/seed/me/100/100" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center pr-1">
            <Input 
              placeholder="Add your live suggestion..." 
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

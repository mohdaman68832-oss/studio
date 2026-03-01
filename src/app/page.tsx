
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, ImageIcon, Video, Type, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const MOCK_IDEAS = [
  {
    id: "1",
    title: "EcoConnect: Smart Grid for Neighborhoods",
    problem: "Rising energy costs and inefficient localized energy distribution.",
    description: "A decentralized platform enabling neighbors to share excess solar energy with zero transaction fees using blockchain technology.",
    category: "Technology",
    userName: "Alex Rivera",
    userAvatar: "https://picsum.photos/seed/user1/100/100",
    mediaUrl: "https://picsum.photos/seed/tech/800/600",
    innovationScore: 92,
    tags: ["Energy", "Blockchain"],
    likes: 124,
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
    tags: ["Health", "AI", "VideoDemo"],
    likes: 89,
  }
];

const CATEGORIES = ["All", "Meme"];
const MEME_TYPES = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "text", label: "Text", icon: Type },
];

export default function FeedPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMemeType, setActiveMemeType] = useState("image");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const [isMemeSheetOpen, setIsMemeSheetOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  const ideasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "ideas"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: firestoreIdeas, isLoading: loading } = useCollection(ideasQuery);

  const ideasToDisplay = useMemo(() => {
    const base = firestoreIdeas && firestoreIdeas.length > 0 ? [...firestoreIdeas] : MOCK_IDEAS;
    const unique = Array.from(new Map(base.map(item => [item.id, item])).values());
    
    let filtered = unique;

    if (activeCategory === "Meme") {
      filtered = unique.filter(i => i.category?.toLowerCase() === "meme");
      filtered = filtered.filter(i => {
        const isVideo = i.mediaUrl && (i.mediaUrl.endsWith('.mp4') || i.mediaUrl.includes('gtv-videos-bucket') || i.mediaUrl.startsWith('data:video'));
        const isText = !i.mediaUrl || i.mediaUrl === "";
        const isImage = i.mediaUrl && !isVideo && !isText;

        if (activeMemeType === "video") return isVideo;
        if (activeMemeType === "text") return isText;
        if (activeMemeType === "image") return isImage;
        return true;
      });
    }

    return filtered;
  }, [firestoreIdeas, activeCategory, activeMemeType]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) setTouchStart(e.touches[0].pageY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStart > 0) {
        const pullDistance = e.touches[0].pageY - touchStart;
        if (pullDistance > 80) setShowRefresh(true);
      }
    };

    const handleTouchEnd = () => {
      setTouchStart(0);
      setTimeout(() => {
        if (window.scrollY > 100) setShowRefresh(false);
      }, 5000);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart]);

  const handleReload = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24 relative">
      <div className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform",
        showRefresh ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
      )}>
        <Button 
          onClick={handleReload}
          className="rounded-full bg-primary text-white shadow-2xl px-6 py-2 flex items-center gap-2 border-2 border-white/20"
          disabled={isRefreshing}
        >
          <RefreshCcw size={16} className={cn(isRefreshing && "animate-spin")} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isRefreshing ? "Refreshing..." : "Release to Refresh"}
          </span>
        </Button>
      </div>

      <header className="mb-6 px-1 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Sphere Feed</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Innovation at your fingertips</p>
        </div>
        
        {activeCategory === "Meme" && (
          <Sheet open={isMemeSheetOpen} onOpenChange={setIsMemeSheetOpen}>
            <SheetTrigger asChild>
              <Button size="icon" className="rounded-full h-12 w-12 bg-primary shadow-lg shadow-primary/20">
                <Plus size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="rounded-t-[2.5rem] h-[45vh] bg-background border-none shadow-2xl"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <SheetHeader>
                <SheetTitle className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">
                  Choose Meme Format
                </SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-5 px-4">
                <Link href="/post?mediaType=image&category=Meme" className="flex flex-col items-center gap-4 p-7 bg-white rounded-[2.5rem] border-2 border-border/50 hover:border-primary transition-all shadow-sm">
                  <ImageIcon className="w-8 h-8 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Image</span>
                </Link>
                <Link href="/post?mediaType=video&category=Meme" className="flex flex-col items-center gap-4 p-7 bg-white rounded-[2.5rem] border-2 border-border/50 hover:border-primary transition-all shadow-sm">
                  <Video className="w-8 h-8 text-secondary" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Video</span>
                </Link>
                <Link href="/post?mediaType=text&category=Meme" className="flex flex-col items-center gap-4 p-7 bg-white rounded-[2.5rem] border-2 border-border/50 hover:border-primary transition-all shadow-sm">
                  <Type className="w-8 h-8 text-muted-foreground" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Text</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </header>

      <div className="flex w-full gap-2 -mx-4 px-4 pt-2 pb-4 mb-2 border-b border-border/50">
        {CATEGORIES.map((cat) => (
          <Button 
            key={cat} 
            variant={cat === activeCategory ? "default" : "secondary"} 
            onClick={() => {
              setActiveCategory(cat);
              if (cat === "Meme") setActiveMemeType("image");
            }}
            className={cn(
              "flex-1 rounded-full h-9 text-[10px] font-black uppercase tracking-widest transition-all",
              cat === activeCategory ? "bg-primary shadow-lg shadow-primary/20 text-white" : "bg-white border-none text-muted-foreground hover:text-primary"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {activeCategory === "Meme" && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 mb-4 animate-in slide-in-from-top-2 duration-300">
          {MEME_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={activeMemeType === type.id ? "default" : "outline"}
                onClick={() => setActiveMemeType(type.id)}
                className={cn(
                  "rounded-full h-10 px-6 flex items-center gap-2 shrink-0 transition-all",
                  activeMemeType === type.id 
                    ? "bg-secondary text-white border-secondary shadow-md" 
                    : "bg-white border-muted text-muted-foreground hover:border-secondary/50"
                )}
              >
                <Icon size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">{type.label}</span>
              </Button>
            );
          })}
        </div>
      )}

      <div className="space-y-8 mt-4">
        {loading ? (
          <div className="space-y-12">
            {[1, 2].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-80 w-full rounded-[2.5rem]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {ideasToDisplay.length > 0 ? (
              ideasToDisplay.map((idea, index) => (
                <div key={idea.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <IdeaCard idea={idea as any} priority={index < 2} />
                </div>
              ))
            ) : (
              <div className="py-20 text-center opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest">No matching content found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

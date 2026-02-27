
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";

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
  },
  {
    id: "3",
    title: "Minimalist Productivity System",
    problem: "App overload and digital distraction.",
    description: "A text-based, ultra-fast productivity system that works in the terminal or as a simple web app. No distractions, just focus.",
    category: "Business",
    userName: "Marcus Vane",
    userAvatar: "https://picsum.photos/seed/user3/100/100",
    mediaUrl: "", // Text post
    innovationScore: 76,
    tags: ["Focus", "Minimalism"],
    likes: 45,
  }
];

const CATEGORIES = ["All", "Meme"];

export default function FeedPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  const ideasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "ideas"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: firestoreIdeas, isLoading: loading } = useCollection(ideasQuery);

  const ideasToDisplay = useMemo(() => {
    const base = firestoreIdeas && firestoreIdeas.length > 0 ? [...firestoreIdeas, ...MOCK_IDEAS] : MOCK_IDEAS;
    const unique = Array.from(new Map(base.map(item => [item.id, item])).values());
    if (activeCategory === "Meme") return unique.filter(i => i.category?.toLowerCase() === "meme");
    return unique;
  }, [firestoreIdeas, activeCategory]);

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
      // Automatically hide button after 5 seconds if not used
      setTimeout(() => {
        if (window.scrollY > 100) setShowRefresh(false);
      }, 5000);
    };

    const handleScroll = () => {
      if (window.scrollY > 300) setShowRefresh(false);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
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
          className="rounded-full bg-primary text-white shadow-2xl px-6 py-2 flex items-center gap-2 border-2 border-white/20 hover:scale-105 transition-transform"
          disabled={isRefreshing}
        >
          <RefreshCcw size={16} className={cn(isRefreshing && "animate-spin")} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isRefreshing ? "Refreshing..." : "Release to Refresh"}
          </span>
        </Button>
      </div>

      <header className="mb-6 px-1 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Sphere Feed</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Innovation at your fingertips</p>
        </div>
      </header>

      <div className="flex w-full gap-2 -mx-4 px-4 pt-2 pb-4 mb-2 border-b border-border/50">
        {CATEGORIES.map((cat) => (
          <Button 
            key={cat} 
            variant={cat === activeCategory ? "default" : "secondary"} 
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-1 rounded-full h-9 text-[10px] font-black uppercase tracking-widest transition-all",
              cat === activeCategory ? "bg-primary shadow-lg shadow-primary/20 text-white" : "bg-white border-none text-muted-foreground hover:text-primary"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="space-y-8 mt-6">
        {loading && (!firestoreIdeas || firestoreIdeas.length === 0) ? (
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
                  <IdeaCard idea={idea as any} priority={index < 2} isMemeView={activeCategory === "Meme"} />
                </div>
              ))
            ) : (
              <div className="py-20 text-center opacity-30">
                <p className="text-xs font-black uppercase tracking-widest">No innovations found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

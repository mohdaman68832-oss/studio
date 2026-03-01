
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useMemo, useState, useEffect, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, ImageIcon, Video, Type, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

const CATEGORIES_LIST = ["All", "Meme"];
const MEME_FORMATS = [
  { label: "Image", id: "image", icon: ImageIcon },
  { label: "Video", id: "video", icon: Video },
  { label: "Text", id: "text", icon: Type },
];

function FeedContent() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMemeFormat, setActiveMemeFormat] = useState("image");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  // Fetch User Profile for Interests
  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(profileRef);
  const userInterests = profileData?.interests || [];

  const ideasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "ideas"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: firestoreIdeas, isLoading: loading } = useCollection(ideasQuery);

  const ideasToDisplay = useMemo(() => {
    const base = firestoreIdeas && firestoreIdeas.length > 0 ? [...firestoreIdeas] : MOCK_IDEAS;
    const unique = Array.from(new Map(base.map(item => [item.id, item])).values());
    
    const isMemePost = (i: any) => {
      const categoryMatch = i.category?.toLowerCase() === "meme" || i.category?.toLowerCase() === "memes";
      const tagMatch = i.tags?.some((t: string) => t.toLowerCase() === "meme");
      const descriptionMatch = i.description?.toLowerCase().includes("#meme") || i.description?.toLowerCase().includes("meme");
      return !!(categoryMatch || tagMatch || descriptionMatch);
    };

    // Determine what we are actually filtering by on the first tab
    const effectiveCategory = activeCategory === "All" && urlCategory ? urlCategory : activeCategory;

    if (effectiveCategory === "All") {
      // EXCLUDE memes from All feed and filter by user interests if they exist
      return unique.filter(i => {
        if (isMemePost(i)) return false;
        if (userInterests.length > 0) {
          return userInterests.some((interest: string) => 
            i.category?.toLowerCase() === interest.toLowerCase() || 
            i.tags?.some((t: string) => t.toLowerCase() === interest.toLowerCase())
          );
        }
        return true;
      });
    }
    
    if (effectiveCategory === "Meme") {
      return unique.filter(i => {
        if (!isMemePost(i)) return false;

        let detectedType = "text";
        if (i.mediaUrl && i.mediaUrl !== "") {
          const url = i.mediaUrl.toLowerCase();
          const isVideoUrl = 
            url.endsWith('.mp4') || 
            url.endsWith('.mov') || 
            url.endsWith('.webm') || 
            url.endsWith('.avi') ||
            url.includes('gtv-videos-bucket') || 
            url.startsWith('data:video');
          
          detectedType = isVideoUrl ? "video" : "image";
        }
        
        return detectedType === activeMemeFormat;
      });
    }

    // Filter by specific category (Selected from URL or manually)
    return unique.filter(i => i.category?.toLowerCase() === effectiveCategory.toLowerCase());
  }, [firestoreIdeas, activeCategory, activeMemeFormat, userInterests, urlCategory]);

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
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
            {activeCategory === "All" && urlCategory ? `Exploring ${urlCategory}` : (activeCategory === "All" && userInterests.length > 0 ? "Tailored to your interests" : "Innovation at your fingertips")}
          </p>
        </div>
        <Link href="/categories">
          <Button variant="ghost" size="icon" className="rounded-full bg-primary/5 text-primary">
            <LayoutGrid size={20} />
          </Button>
        </Link>
      </header>

      <div className="flex w-full gap-2 -mx-4 px-4 pt-2 pb-4 mb-2 border-b border-border/50">
        {CATEGORIES_LIST.map((cat) => {
          const isAll = cat === "All";
          let displayLabel = cat;
          
          if (isAll) {
            if (urlCategory) {
              displayLabel = urlCategory;
            } else if (userInterests.length === 0) {
              displayLabel = "Explore Hubs";
            }
          }
          
          return (
            <Button 
              key={cat} 
              variant={cat === activeCategory ? "default" : "secondary"} 
              onClick={() => {
                if (isAll && !urlCategory && userInterests.length === 0) {
                  router.push("/categories");
                  return;
                }
                setActiveCategory(cat);
                if (cat === "Meme") setActiveMemeFormat("image");
              }}
              className={cn(
                "flex-1 rounded-full h-9 text-[10px] font-black uppercase tracking-widest transition-all",
                cat === activeCategory ? "bg-primary shadow-lg shadow-primary/20 text-white" : "bg-white border-none text-muted-foreground hover:text-primary"
              )}
            >
              {displayLabel}
            </Button>
          );
        })}
      </div>

      {activeCategory === "Meme" && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 mb-4 animate-in slide-in-from-top-2 duration-300">
          {MEME_FORMATS.map((fmt) => (
            <Button
              key={fmt.id}
              variant={activeMemeFormat === fmt.id ? "default" : "outline"}
              onClick={() => setActiveMemeFormat(fmt.id)}
              className={cn(
                "rounded-full h-10 px-6 flex items-center gap-2 shrink-0 transition-all",
                activeMemeFormat === fmt.id 
                  ? "bg-secondary text-white border-secondary shadow-md" 
                  : "bg-white text-muted-foreground border-muted hover:border-secondary/50"
              )}
            >
              <fmt.icon size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{fmt.label}</span>
            </Button>
          ))}
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
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest">No matching content yet</p>
                <p className="text-[9px] font-medium max-w-[200px] text-center">
                  {urlCategory ? `We couldn't find any posts in the ${urlCategory} category.` : "We couldn't find posts matching your interests."}
                </p>
                <Link href="/categories">
                  <Button variant="outline" className="rounded-full mt-4 text-[10px] font-black uppercase">Explore Your Hubs</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}

function Loader2({ className, ...props }: any) {
  return <RefreshCcw className={cn("animate-spin", className)} {...props} />
}

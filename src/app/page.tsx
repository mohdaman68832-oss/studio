"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useMemo, useState, useEffect, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function FeedContent() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(profileRef);
  const userInterests = profileData?.interests || [];

  // PART 3: Firestore client calls run ONLY in Client Components
  const postsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "posts"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: firestorePosts, isLoading: loading } = useCollection(postsQuery);

  const postsToDisplay = useMemo(() => {
    if (!firestorePosts) return [];
    
    // Determine filter
    const effectiveCategory = activeCategory === "All" && urlCategory ? urlCategory : activeCategory;

    if (effectiveCategory === "All") {
      if (userInterests.length > 0) {
        return firestorePosts.filter(i => 
          userInterests.some((interest: string) => i.category?.toLowerCase() === interest.toLowerCase())
        );
      }
      return firestorePosts;
    }
    
    return firestorePosts.filter(i => i.category?.toLowerCase() === effectiveCategory.toLowerCase());
  }, [firestorePosts, activeCategory, userInterests, urlCategory]);

  const handleReload = () => {
    setIsRefreshing(true);
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24 relative">
      <div className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform",
        showRefresh ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
      )}>
        <Button onClick={handleReload} className="rounded-full bg-primary text-white shadow-2xl px-6 py-2 flex items-center gap-2 border-2 border-white/20" disabled={isRefreshing}>
          <RefreshCcw size={16} className={cn(isRefreshing && "animate-spin")} />
          <span className="text-[10px] font-black uppercase tracking-widest">Release to Refresh</span>
        </Button>
      </div>

      <header className="mb-6 px-1 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Sphere Feed</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
            {urlCategory ? `Exploring ${urlCategory}` : "Innovation at your fingertips"}
          </p>
        </div>
        <Link href="/categories">
          <Button variant="ghost" size="icon" className="rounded-full bg-primary/5 text-primary">
            <LayoutGrid size={20} />
          </Button>
        </Link>
      </header>

      <div className="flex w-full gap-2 -mx-4 px-4 pt-2 pb-4 mb-2 border-b">
        {["All", "Meme"].map((cat) => (
          <Button 
            key={cat} 
            variant={cat === activeCategory ? "default" : "secondary"} 
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-1 rounded-full h-9 text-[10px] font-black uppercase tracking-widest",
              cat === activeCategory ? "bg-primary text-white shadow-lg" : "bg-white text-muted-foreground"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

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
        ) : postsToDisplay.length > 0 ? (
          postsToDisplay.map((post, index) => (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <IdeaCard idea={post as any} priority={index < 2} />
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest">No posts yet</p>
            <Link href="/categories"><Button variant="outline" className="rounded-full text-[10px] font-black uppercase">Explore Hubs</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><RefreshCcw className="animate-spin text-primary h-8 w-8" /></div>}>
      <FeedContent />
    </Suspense>
  );
}
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, where, doc } from "firebase/firestore";
import { useMemo, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, LayoutGrid, Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function FeedContent() {
  const db = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // FETCHING USER PROFILE
  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(profileRef);

  // PROFESSIONAL PRIVATE QUERY: Filter by current user UID for strict rules
  const postsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "posts"), 
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user?.uid]);

  const { data: firestorePosts, isLoading: loading } = useCollection(postsQuery);

  const postsToDisplay = useMemo(() => {
    if (!firestorePosts) return [];
    
    const effectiveCategory = activeCategory === "All" && urlCategory ? urlCategory : activeCategory;

    if (effectiveCategory === "All") {
      return firestorePosts;
    }
    
    return firestorePosts.filter(i => i.category?.toLowerCase() === effectiveCategory.toLowerCase());
  }, [firestorePosts, activeCategory, urlCategory]);

  const handleReload = () => {
    setIsRefreshing(true);
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24 relative">
      <header className="mb-6 px-1 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">My Sphere</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Lock size={10} className="text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              Private Feed
            </p>
          </div>
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
          <div className="py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
            <Lock size={48} className="text-primary/20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No private posts found</p>
            <Link href="/post"><Button variant="outline" className="rounded-full text-[10px] font-black uppercase">Publish First Post</Button></Link>
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

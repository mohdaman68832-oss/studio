
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, LayoutGrid, Globe, ImageIcon, Video, Type } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function FeedContent() {
  const db = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState("All");
  const [memeType, setMemeType] = useState<"all" | "image" | "video" | "text">("all");

  // Filtered query for Home Feed
  const postsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "posts"), 
      orderBy("createdAt", "desc")
    );
  }, [db, user?.uid]);

  const { data: firestorePosts, isLoading: loading } = useCollection(postsQuery);

  const postsToDisplay = useMemo(() => {
    if (!firestorePosts) return [];
    
    const effectiveCategory = activeCategory === "All" && urlCategory ? urlCategory : activeCategory;

    let filtered = firestorePosts;

    if (effectiveCategory !== "All") {
      filtered = filtered.filter(i => i.category?.toLowerCase() === effectiveCategory.toLowerCase());
    }

    if (effectiveCategory === "Meme" && memeType !== "all") {
      filtered = filtered.filter(i => i.mediaType === memeType);
    }
    
    return filtered;
  }, [firestorePosts, activeCategory, urlCategory, memeType]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24 relative">
      <header className="mb-6 px-1 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Sphere Feed</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Globe size={10} className="text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              Global Innovation Hub
            </p>
          </div>
        </div>
        <Link href="/categories">
          <Button variant="ghost" size="icon" className="rounded-full bg-primary/5 text-primary">
            <LayoutGrid size={20} />
          </Button>
        </Link>
      </header>

      {/* Main Category Bar - Updated for Full Width */}
      <div className="flex w-full gap-3 py-2 pb-4 mb-2 border-b">
        {["All", "Meme"].map((cat) => (
          <Button 
            key={cat} 
            variant={cat === activeCategory ? "default" : "secondary"} 
            onClick={() => {
              setActiveCategory(cat);
              if (cat !== "Meme") setMemeType("all");
            }}
            className={cn(
              "flex-1 rounded-full h-10 text-[11px] font-black uppercase tracking-widest transition-all",
              cat === activeCategory 
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                : "bg-white text-muted-foreground border border-border"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Meme Specific Options */}
      {activeCategory === "Meme" && (
        <div className="flex w-full gap-2 mb-6 animate-in slide-in-from-top-2 duration-300">
          <Button 
            variant={memeType === "image" ? "default" : "outline"} 
            onClick={() => setMemeType(memeType === "image" ? "all" : "image")}
            className={cn(
              "flex-1 rounded-2xl h-14 flex-col gap-1 border-2",
              memeType === "image" ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : "bg-white border-muted text-muted-foreground"
            )}
          >
            <ImageIcon size={18} />
            <span className="text-[8px] font-black uppercase">Image Meme</span>
          </Button>
          <Button 
            variant={memeType === "video" ? "default" : "outline"} 
            onClick={() => setMemeType(memeType === "video" ? "all" : "video")}
            className={cn(
              "flex-1 rounded-2xl h-14 flex-col gap-1 border-2",
              memeType === "video" ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : "bg-white border-muted text-muted-foreground"
            )}
          >
            <Video size={18} />
            <span className="text-[8px] font-black uppercase">Video Meme</span>
          </Button>
          <Button 
            variant={memeType === "text" ? "default" : "outline"} 
            onClick={() => setMemeType(memeType === "text" ? "all" : "text")}
            className={cn(
              "flex-1 rounded-2xl h-14 flex-col gap-1 border-2",
              memeType === "text" ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : "bg-white border-muted text-muted-foreground"
            )}
          >
            <Type size={18} />
            <span className="text-[8px] font-black uppercase">Text Meme</span>
          </Button>
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
        ) : postsToDisplay.length > 0 ? (
          postsToDisplay.map((post, index) => (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <IdeaCard idea={post as any} priority={index < 2} />
            </div>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
            <Globe size={48} className="text-primary/20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No innovations found</p>
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

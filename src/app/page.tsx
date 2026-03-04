
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, where, doc, limit } from "firebase/firestore";
import { useMemo, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, LayoutGrid, Globe, ImageIcon, Video, Type, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function GroupSuggestionRow({ userInterests }: { userInterests: string[] }) {
  const db = useFirestore();
  
  const groupsQuery = useMemoFirebase(() => {
    if (!db || !userInterests?.length) return null;
    return query(
      collection(db, "groups"),
      where("category", "in", userInterests.slice(0, 10)),
      limit(6)
    );
  }, [db, userInterests]);

  const { data: suggestedGroups, isLoading } = useCollection(groupsQuery);

  if (isLoading || !suggestedGroups || suggestedGroups.length === 0) return null;

  return (
    <div className="bg-primary/5 -mx-4 px-4 py-8 space-y-4 border-y border-primary/10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Users size={14} /> Recommended Hubs
          </h3>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Based on your interests</p>
        </div>
        <Link href="/chat">
          <Button variant="ghost" className="text-[9px] font-black uppercase text-secondary h-6 p-0">Explore More</Button>
        </Link>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {suggestedGroups.map((group) => (
          <Link key={group.id} href={`/groups/${group.id}`} className="shrink-0 w-36 bg-white p-4 rounded-[2.5rem] border border-primary/5 shadow-sm flex flex-col items-center gap-2 hover:border-primary/20 transition-all group">
            <Avatar className="h-14 w-14 rounded-2xl border-2 border-transparent group-hover:border-primary transition-all">
              <AvatarImage src={group.avatarUrl || `https://picsum.photos/seed/${group.id}/100/100`} className="object-cover" />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">{group.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center w-full">
              <p className="text-[10px] font-black truncate uppercase tracking-tighter">{group.name}</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-60">{group.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeedContent() {
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState("All");
  const [memeType, setMemeType] = useState<"all" | "image" | "video" | "text" | "group">("all");

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(profileRef);

  const userInterests = profileData?.interests || [];

  const postsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "posts"), 
      orderBy("createdAt", "desc")
    );
  }, [db, user?.uid]);

  const { data: firestorePosts, isLoading: loading } = useCollection(postsQuery);

  // Separate query for groups if user filters Meme Hubs
  const memeGroupsQuery = useMemoFirebase(() => {
    if (!db || activeCategory !== "Meme" || memeType !== "group") return null;
    return query(
      collection(db, "groups"),
      where("category", "==", "Memes"),
      limit(20)
    );
  }, [db, activeCategory, memeType]);

  const { data: memeGroups } = useCollection(memeGroupsQuery);

  const postsToDisplay = useMemo(() => {
    if (!firestorePosts) return [];
    
    const effectiveCategory = activeCategory === "All" && urlCategory ? urlCategory : activeCategory;

    let filtered = firestorePosts;

    if (effectiveCategory === "All") {
      if (userInterests.length > 0 && !urlCategory) {
        filtered = filtered.filter(post => 
          userInterests.some(interest => post.category?.toLowerCase() === interest.toLowerCase())
        );
      }
    } else {
      filtered = filtered.filter(i => i.category?.toLowerCase() === effectiveCategory.toLowerCase());
    }

    if (effectiveCategory === "Meme" && memeType !== "all" && memeType !== "group") {
      filtered = filtered.filter(i => i.mediaType === memeType);
    }
    
    return filtered;
  }, [firestorePosts, activeCategory, urlCategory, memeType, userInterests]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24 relative">
      <header className="mb-6 px-1 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Sphere Feed</h1>
          <div className="flex items-center gap-1.5 mt-1">
            {(activeCategory === "All" && !urlCategory) ? (
              <Sparkles size={10} className="text-secondary animate-pulse" />
            ) : (
              <Globe size={10} className="text-muted-foreground" />
            )}
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              {activeCategory === "All" && urlCategory 
                ? `${urlCategory} Hub`
                : activeCategory === "All" 
                  ? "Personalized For You" 
                  : "Global Innovation Hub"}
            </p>
          </div>
        </div>
        <Link href="/categories">
          <Button variant="ghost" size="icon" className="rounded-full bg-primary/5 text-primary">
            <LayoutGrid size={20} />
          </Button>
        </Link>
      </header>

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
            {cat === "All" && urlCategory ? urlCategory : cat}
          </Button>
        ))}
      </div>

      {activeCategory === "Meme" && (
        <div className="flex w-full gap-2 mb-6 animate-in slide-in-from-top-2 duration-300 overflow-x-auto no-scrollbar pb-2 px-1">
          <Button 
            variant={memeType === "image" ? "default" : "outline"} 
            onClick={() => setMemeType(memeType === "image" ? "all" : "image")}
            className={cn(
              "flex-1 min-w-[85px] rounded-2xl h-14 flex-col gap-1 border-2",
              memeType === "image" ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : "bg-white border-muted text-muted-foreground"
            )}
          >
            <ImageIcon size={18} />
            <span className="text-[8px] font-black uppercase">Image</span>
          </Button>
          <Button 
            variant={memeType === "video" ? "default" : "outline"} 
            onClick={() => setMemeType(memeType === "video" ? "all" : "video")}
            className={cn(
              "flex-1 min-w-[85px] rounded-2xl h-14 flex-col gap-1 border-2",
              memeType === "video" ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : "bg-white border-muted text-muted-foreground"
            )}
          >
            <Video size={18} />
            <span className="text-[8px] font-black uppercase">Video</span>
          </Button>
          <Button 
            variant={memeType === "text" ? "default" : "outline"} 
            onClick={() => setMemeType(memeType === "text" ? "all" : "text")}
            className={cn(
              "flex-1 min-w-[85px] rounded-2xl h-14 flex-col gap-1 border-2",
              memeType === "text" ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : "bg-white border-muted text-muted-foreground"
            )}
          >
            <Type size={18} />
            <span className="text-[8px] font-black uppercase">Text</span>
          </Button>
          <Button 
            variant={memeType === "group" ? "default" : "outline"} 
            onClick={() => setMemeType(memeType === "group" ? "all" : "group")}
            className={cn(
              "flex-1 min-w-[85px] rounded-2xl h-14 flex-col gap-1 border-2",
              memeType === "group" ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-muted text-muted-foreground"
            )}
          >
            <Users size={18} />
            <span className="text-[8px] font-black uppercase">Hubs</span>
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
        ) : memeType === "group" ? (
          <div className="grid grid-cols-1 gap-4">
            {memeGroups && memeGroups.length > 0 ? (
              memeGroups.map((group) => (
                <div 
                  key={group.id} 
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="bg-white p-5 rounded-[2.5rem] border-2 border-primary/10 flex items-center gap-4 cursor-pointer hover:border-primary transition-all shadow-sm group"
                >
                  <Avatar className="h-14 w-14 rounded-2xl border-2 border-transparent group-hover:border-primary transition-all">
                    <AvatarImage src={group.avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">{group.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-sm font-black uppercase tracking-tight">{group.name}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{group.description}</p>
                  </div>
                  <Users size={18} className="text-primary opacity-20" />
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-4 opacity-30">
                <Users size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Meme Hubs found</p>
              </div>
            )}
          </div>
        ) : postsToDisplay.length > 0 ? (
          postsToDisplay.map((post, index) => (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <IdeaCard idea={post as any} priority={index < 2} />
              
              {(index === 19 || index === 29 || index === 49) && (
                <div className="mt-8 mb-4">
                  <GroupSuggestionRow userInterests={userInterests} />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
            <Globe size={48} className="text-primary/20" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              {activeCategory === "All" && urlCategory
                ? `No innovations in ${urlCategory}`
                : activeCategory === "All" 
                  ? "No innovations in your selected hubs" 
                  : "No innovations found"}
            </p>
            <Link href="/categories">
              <Button variant="outline" className="rounded-full text-[10px] font-black uppercase">
                Explore More Hubs
              </Button>
            </Link>
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


"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Users, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Type, 
  LayoutGrid,
  Pencil,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { IdeaCard } from "@/components/feed/idea-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MOCK_UNIONS = [
  {
    id: "u1",
    name: "AI Frontiers",
    description: "Building the next generation of neural networks. We focus on LLMs, Computer Vision, and Robotics. Join us to build the future of intelligence together.",
    category: "Technology",
    memberCount: 1240,
    avatar: "https://picsum.photos/seed/ai/100/100",
    stats: {
      dailyMessages: 452,
      weeklyPosts: 84,
      activeToday: 156
    }
  },
  {
    id: "u2",
    name: "Green Future Union",
    description: "Collaborative hub for sustainable energy solutions. Solar, Wind, and Hydro experts unite to create a greener tomorrow.",
    category: "Sustainability",
    memberCount: 856,
    avatar: "https://picsum.photos/seed/green/100/100",
    stats: {
      dailyMessages: 210,
      weeklyPosts: 32,
      activeToday: 45
    }
  }
];

export default function UnionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const unionId = params.id as string;
  const [showFullDesc, setShowFullDesc] = useState(false);

  const union = useMemo(() => {
    return MOCK_UNIONS.find(u => u.id === unionId) || MOCK_UNIONS[0];
  }, [unionId]);

  const postsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "ideas"),
      where("category", "==", union.category),
      orderBy("createdAt", "desc")
    );
  }, [db, union.category]);

  const { data: posts, loading: postsLoading } = useCollection(postsQuery);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-3 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-sm uppercase tracking-tighter truncate">{union.name}</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Community Hub</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6 space-y-6">
          {/* Hero Section: Profile in Corner, Name, Description */}
          <div className="flex gap-4 items-start">
            <Avatar className="h-20 w-20 rounded-3xl border-2 border-primary/10 shadow-lg shrink-0">
              <AvatarImage src={union.avatar} className="object-cover" />
              <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">{union.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none mb-2">{union.name}</h2>
              <div className="space-y-1">
                <p className={cn(
                  "text-[11px] text-muted-foreground leading-relaxed",
                  !showFullDesc && "line-clamp-2"
                )}>
                  {union.description}
                </p>
                <button 
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-[10px] font-black text-primary uppercase flex items-center gap-1 mt-1"
                >
                  {showFullDesc ? (
                    <>See less <ChevronUp size={10} /></>
                  ) : (
                    <>See more <ChevronDown size={10} /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar with Join/Active count and Pencil/Post button */}
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-border/50 shadow-sm">
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="text-sm font-black text-foreground">{union.memberCount.toLocaleString()}</span>
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Joined</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-green-500">{union.stats.activeToday}</span>
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Active</span>
              </div>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" className="rounded-full h-10 px-5 flex items-center gap-2 bg-primary shadow-lg shadow-primary/20">
                  <Pencil size={14} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Post</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[40vh] bg-background">
                <SheetHeader>
                  <SheetTitle className="text-center text-sm font-black uppercase tracking-widest mb-6">
                    Choose Post Format
                  </SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-4 px-2">
                  <Link href="/post" className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border-2 border-border hover:border-primary transition-all">
                    <ImageIcon className="w-8 h-8 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Image</span>
                  </Link>
                  <Link href="/post" className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border-2 border-border hover:border-primary transition-all">
                    <Video className="w-8 h-8 text-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Video</span>
                  </Link>
                  <Link href="/post" className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border-2 border-border hover:border-primary transition-all">
                    <Type className="w-8 h-8 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Text</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Union Feed</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            
            <div className="space-y-6">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <IdeaCard key={post.id} idea={post as any} />
                ))
              ) : (
                <div className="py-20 text-center space-y-4 opacity-30">
                  <LayoutGrid size={48} className="mx-auto" />
                  <p className="text-xs font-black uppercase tracking-widest">No posts in this union yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Type, 
  LayoutGrid,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { IdeaCard } from "@/components/feed/idea-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MOCK_GROUPS = [
  {
    id: "g1",
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
    id: "g2",
    name: "Green Future Hub",
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

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const groupId = params.id as string;
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const group = useMemo(() => {
    return MOCK_GROUPS.find(g => g.id === groupId) || MOCK_GROUPS[0];
  }, [groupId]);

  // Unified to 'posts' collection
  const postsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "posts"),
      where("category", "==", group.category),
      orderBy("createdAt", "desc")
    );
  }, [db, group.category]);

  const { data: posts, isLoading: postsLoading } = useCollection(postsQuery);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-3 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-sm uppercase tracking-tighter truncate">{group.name}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Community Hub</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6 space-y-8">
          <div className="flex gap-4 items-start">
            <Avatar className="h-24 w-24 rounded-[2rem] border-2 border-primary/10 shadow-xl shrink-0">
              <AvatarImage src={group.avatar} className="object-cover" />
              <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary uppercase">{group.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-2">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none mb-3">{group.name}</h2>
              <div className="space-y-1">
                <p className={cn(
                  "text-[12px] text-muted-foreground leading-relaxed font-medium",
                  !showFullDesc && "line-clamp-2"
                )}>
                  {group.description}
                </p>
                <button 
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-[10px] font-black text-primary uppercase flex items-center gap-1 mt-2"
                >
                  {showFullDesc ? (
                    <>See less <ChevronUp size={12} /></>
                  ) : (
                    <>See more <ChevronDown size={12} /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-xl">
            <div className="flex gap-5">
              <div className="flex flex-col">
                <span className="text-base font-black text-foreground">{(group.memberCount + (isJoined ? 1 : 0)).toLocaleString()}</span>
                <span className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Joined</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-green-500">{group.stats.activeToday}</span>
                <span className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Online</span>
              </div>
            </div>

            {!isJoined ? (
              <Button 
                onClick={() => {
                  setIsJoined(true);
                  toast({ title: "Joined!", description: `You are now a member of ${group.name}` });
                }}
                size="sm" 
                className="rounded-full h-11 px-7 flex items-center gap-2 bg-secondary shadow-lg shadow-secondary/20 active:scale-95 transition-transform"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Join Group</span>
              </Button>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" className="rounded-full h-11 px-6 flex items-center gap-2 bg-primary shadow-xl shadow-primary/20">
                    <Pencil size={14} className="fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Post</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[3rem] h-[45vh] bg-background border-none shadow-2xl">
                  <SheetHeader>
                    <SheetTitle className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">
                      Choose Post Format
                    </SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-3 gap-5 px-4">
                    <Link href="/post" className="flex flex-col items-center gap-4 p-7 bg-white rounded-[2.5rem] border-2 border-border/50 hover:border-primary transition-all shadow-sm">
                      <ImageIcon className="w-8 h-8 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Image</span>
                    </Link>
                    <Link href="/post" className="flex flex-col items-center gap-4 p-7 bg-white rounded-[2.5rem] border-2 border-border/50 hover:border-primary transition-all shadow-sm">
                      <Video className="w-8 h-8 text-secondary" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Video</span>
                    </Link>
                    <Link href="/post" className="flex flex-col items-center gap-4 p-7 bg-white rounded-[2.5rem] border-2 border-border/50 hover:border-primary transition-all shadow-sm">
                      <Type className="w-8 h-8 text-muted-foreground" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Text</span>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Group Feed</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            
            <div className="space-y-10 pb-12">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <IdeaCard key={post.id} idea={post as any} />
                ))
              ) : (
                <div className="py-24 text-center space-y-4 opacity-30">
                  <LayoutGrid size={48} className="mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No innovations in this group yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
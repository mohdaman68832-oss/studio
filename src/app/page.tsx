
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";

const MOCK_IDEAS = [
  {
    id: "1",
    title: "EcoConnect: Smart Grid for Neighborhoods",
    problem: "Rising energy costs and inefficient localized energy distribution.",
    description: "A decentralized platform enabling neighbors to share excess solar energy with zero transaction fees using blockchain technology.",
    category: "Mimi",
    userName: "Alex Rivera",
    userAvatar: "https://picsum.photos/seed/user1/100/100",
    mediaUrl: "https://picsum.photos/seed/tech/800/600",
    innovationScore: 92,
    tags: ["Mimi", "Special", "Energy"],
    likes: 245,
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
    likes: 189,
  },
  {
    id: "4",
    title: "Shadow Realm: Next-Gen VR RPG",
    problem: "Lack of truly immersive and reactive environments in current VR gaming.",
    description: "A VR RPG where the world dynamically evolves based on your choices using generative AI for NPC dialogue and quest generation.",
    category: "Mimi",
    userName: "Kaelen Voss",
    userAvatar: "https://picsum.photos/seed/kaelen/100/100",
    mediaUrl: "https://picsum.photos/seed/gaming/800/600",
    innovationScore: 95,
    tags: ["Mimi", "Gaming", "AI"],
    likes: 512,
  },
  {
    id: "5",
    title: "CanvasFlow: Collaborative Digital Murals",
    problem: "Artists struggling to collaborate in real-time on large-scale digital projects.",
    description: "An infinite digital canvas where hundreds of artists can contribute to a single mural simultaneously with low latency and smart layer management.",
    category: "Art",
    userName: "Maya Artiste",
    userAvatar: "https://picsum.photos/seed/maya/100/100",
    mediaUrl: "https://picsum.photos/seed/artpro/800/600",
    innovationScore: 84,
    tags: ["DigitalArt", "Collab", "Creative"],
    likes: 328,
  },
  {
    id: "3",
    title: "Aura: Personal Air Purifier",
    problem: "High levels of urban air pollution affecting daily respiratory health.",
    description: "Stylish, portable neck-worn air purifier using ionized filtration to create a clean air bubble around the user in polluted urban areas.",
    category: "Technology",
    userName: "Marcus Vane",
    userAvatar: "https://picsum.photos/seed/user3/100/100",
    mediaUrl: "", // Text post
    innovationScore: 76,
    tags: ["IoT", "Urban", "TextPost"],
    likes: 134,
  }
];

const CATEGORIES = ["All", "Mimi"];

export default function FeedPage() {
  const db = useFirestore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  const ideasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "ideas"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: firestoreIdeas, isLoading: loading } = useCollection(ideasQuery);

  const ideasToDisplay = useMemo(() => {
    const base = firestoreIdeas && firestoreIdeas.length > 0 ? firestoreIdeas : MOCK_IDEAS;
    if (activeCategory === "All") return base;
    return base.filter(i => i.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [firestoreIdeas, activeCategory]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 10) {
        setShowRefresh(true);
      } else {
        setShowRefresh(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleReload = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24 relative">
      <div className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform",
        showRefresh ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
      )}>
        <Button 
          onClick={handleReload}
          className="rounded-full bg-primary text-white shadow-2xl px-6 py-2 flex items-center gap-2 border-2 border-white/20"
          disabled={isRefreshing}
        >
          <RefreshCcw size={16} className={cn(isRefreshing && "animate-spin")} />
          <span className="text-[10px] font-black uppercase tracking-widest">Reload Feed</span>
        </Button>
      </div>

      <header className="mb-6 px-1 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Sphere Feed</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Innovation at your fingertips</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar sticky top-0 bg-background/80 backdrop-blur-md z-10 -mx-4 px-4 pt-2 mb-2 border-b border-border/50">
        {CATEGORIES.map((cat) => (
          <Button 
            key={cat} 
            variant={cat === activeCategory ? "default" : "secondary"} 
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full h-9 text-[10px] font-black px-10 shrink-0 uppercase tracking-tighter transition-all",
              cat === activeCategory ? "bg-primary shadow-lg shadow-primary/20" : "bg-white border-none text-muted-foreground hover:text-primary"
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
                <div className="flex items-center gap-3">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2">
                     <Skeleton className="h-3 w-24" />
                     <Skeleton className="h-2 w-16" />
                   </div>
                </div>
                <Skeleton className="h-80 w-full rounded-[2.5rem]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {ideasToDisplay.length > 0 ? (
              ideasToDisplay.map((idea, index) => (
                <div key={idea.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                  <IdeaCard idea={idea as any} priority={index < 2} />
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 opacity-30">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                   <span className="text-2xl">🌍</span>
                </div>
                <p className="text-xs font-black uppercase tracking-widest">No innovations found in {activeCategory}</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveCategory("All")} className="text-[10px] font-black uppercase">
                  View All Feed
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

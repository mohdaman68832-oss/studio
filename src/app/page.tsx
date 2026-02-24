
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const MOCK_IDEAS = [
  {
    id: "1",
    title: "EcoConnect: Smart Grid for Neighborhoods",
    description: "A decentralized platform enabling neighbors to share excess solar energy with zero transaction fees using blockchain technology.",
    category: "Sustainability",
    userName: "Alex Rivera",
    userAvatar: "https://picsum.photos/seed/user1/100/100",
    mediaUrl: "https://picsum.photos/seed/tech/800/600",
    innovationScore: 92,
    tags: ["GreenTech", "Blockchain", "Energy"],
    likes: 245,
  },
  {
    id: "2",
    title: "NeuroFocus: AI-Driven ADHD Support",
    description: "Wearable device that monitors focus levels and provides subtle haptic feedback to help individuals with ADHD maintain deep work states.",
    category: "Healthcare",
    userName: "Sarah Chen",
    userAvatar: "https://picsum.photos/seed/user2/100/100",
    mediaUrl: "https://picsum.photos/seed/health/800/600",
    innovationScore: 88,
    tags: ["Health", "AI", "Wearable"],
    likes: 189,
  },
  {
    id: "3",
    title: "Aura: Personal Air Purifier",
    description: "Stylish, portable neck-worn air purifier using ionized filtration to create a clean air bubble around the user in polluted urban areas.",
    category: "Technology",
    userName: "Marcus Vane",
    userAvatar: "https://picsum.photos/seed/user3/100/100",
    mediaUrl: "https://picsum.photos/seed/urban/800/600",
    innovationScore: 76,
    tags: ["IoT", "Urban", "Health"],
    likes: 134,
  }
];

export default function FeedPage() {
  const db = useFirestore();
  const [activeCategory, setActiveCategory] = useState("All");

  const ideasQuery = useMemo(() => {
    if (!db) return null;
    // We fetch all ideas and filter client-side for immediate responsiveness without index errors
    return query(collection(db, "ideas"));
  }, [db]);

  const { data: firestoreIdeas, loading } = useCollection(ideasQuery);

  const ideasToDisplay = useMemo(() => {
    let base = firestoreIdeas && firestoreIdeas.length > 0 ? firestoreIdeas : MOCK_IDEAS;
    if (activeCategory === "All") return base;
    return base.filter(i => i.category === activeCategory);
  }, [firestoreIdeas, activeCategory]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24">
      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar sticky top-0 bg-background/80 backdrop-blur-md z-10 -mx-4 px-4 pt-2">
        {["All", "Art", "Game", "Study", "Technology", "Sustainability", "Healthcare"].map((cat) => (
          <Button 
            key={cat} 
            variant={cat === activeCategory ? "default" : "secondary"} 
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full h-8 text-[10px] font-black px-5 shrink-0 uppercase tracking-tighter transition-all",
              cat === activeCategory ? "bg-primary shadow-lg shadow-primary/20" : "bg-white border-none"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Ideas Feed */}
      <div className="space-y-6 mt-6">
        {loading ? (
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
          ideasToDisplay.map((idea) => (
            <IdeaCard key={idea.id} idea={idea as any} />
          ))
        )}
      </div>
    </div>
  );
}

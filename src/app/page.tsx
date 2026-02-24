
"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data as fallback or initial state
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

  const ideasQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "ideas"), orderBy("title", "asc"));
  }, [db]);

  const { data: firestoreIdeas, loading } = useCollection(ideasQuery);

  // Use Firestore ideas if available, otherwise fallback to mock data
  const ideasToDisplay = firestoreIdeas && firestoreIdeas.length > 0 ? firestoreIdeas : MOCK_IDEAS;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-8 pb-24">
      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {["All", "Sustainability", "Healthcare", "FinTech", "AI", "Education"].map((cat) => (
          <Button 
            key={cat} 
            variant={cat === "All" ? "default" : "secondary"} 
            className={cn(
              "rounded-full h-8 text-xs font-bold px-5 shrink-0 uppercase tracking-tighter",
              cat === "All" ? "bg-primary shadow-lg shadow-primary/20" : "bg-white border-none"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Ideas Feed */}
      <div className="space-y-4 mt-4">
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-10 w-1/2 rounded-full" />
                <Skeleton className="h-64 w-full rounded-[2.5rem]" />
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

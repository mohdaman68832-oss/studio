"use client";

import { IdeaCard } from "@/components/feed/idea-card";
import { Button } from "@/components/ui/button";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    comments: 42,
    commentsList: [
      {
        id: "c1",
        userName: "Elena Smith",
        userAvatar: "https://picsum.photos/seed/user4/100/100",
        text: "Suggestion: Integrating a local battery storage system would make the grid even more resilient during peak hours!"
      },
      {
        id: "c2",
        userName: "Mark Thompson",
        userAvatar: "https://picsum.photos/seed/user5/100/100",
        text: "Feedback: The blockchain aspect is great, but ensure the UI is simple enough for non-technical homeowners."
      }
    ]
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
    comments: 31,
    commentsList: [
      {
        id: "c3",
        userName: "David Wilson",
        userAvatar: "https://picsum.photos/seed/user6/100/100",
        text: "Suggestion: Maybe add a 'Study Buddy' mode where two users can sync focus sessions to encourage accountability?"
      }
    ]
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
    comments: 18,
    commentsList: [
      {
        id: "c4",
        userName: "Chloe Lam",
        userAvatar: "https://picsum.photos/seed/user7/100/100",
        text: "Feedback: Love the design. Could you make the filters compostable to reduce waste? That would be a huge selling point."
      }
    ]
  }
];

export default function FeedPage() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-4 pt-6 pb-24">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {/* Logo and title removed as requested */}
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="w-6 h-6 text-muted-foreground" />
        </Button>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder="Explore new innovations..." 
          className="pl-10 h-12 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20 text-sm"
        />
      </div>

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

      <div className="space-y-4 mt-4">
        {MOCK_IDEAS.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </div>
  );
}

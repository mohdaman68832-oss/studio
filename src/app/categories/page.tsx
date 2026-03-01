
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, LayoutGrid, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = [
  "Education", "Technology", "AI & Tools", "App Development", "Business & Startup", 
  "Career & Jobs", "Government Exams", "Finance & Investment", "Earning Online", 
  "Health & Fitness", "Mental Health", "Self Improvement", "Motivation", 
  "Relationships", "Social Issues", "Politics", "Current Affairs", "History", 
  "Science", "Gaming", "Movies & Web Series", "Music", "Sports", "Memes", 
  "Stories & Shayari", "Opinion / Debate", "Pencil Sketch", "Portrait Drawing", 
  "Cartoon Drawing", "Realistic Drawing", "Doodle Art", "Digital Art", "AI Art", 
  "Painting", "Learn Drawing", "Art Feedback", "Art Competitions"
];

export default function CategoriesPage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background p-6 pb-24 space-y-8">
      <header className="flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Explore</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Discover Innovation Hubs</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {ALL_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant="outline"
            className="h-28 rounded-[2.5rem] flex flex-col gap-3 border-muted/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            onClick={() => router.push(`/?category=${cat}`)}
          >
            <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Sparkles size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">{cat}</span>
          </Button>
        ))}
      </div>

      <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10 text-center space-y-4">
        <LayoutGrid className="mx-auto text-primary opacity-30" size={40} />
        <h3 className="text-sm font-black uppercase tracking-tighter">Global Hubs</h3>
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
          Select a category to see specialized innovations and memes from creators around the globe.
        </p>
      </div>
    </div>
  );
}


"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-background p-6 pb-24 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Explore</h1>
        <p className="text-xs text-muted-foreground font-bold">Discover new innovations and experts</p>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search keywords, users..." 
            className="pl-10 h-12 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20 text-sm"
          />
        </div>
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none shadow-sm bg-white">
          <Filter size={20} className="text-muted-foreground" />
        </Button>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trending Topics</h3>
        <div className="flex flex-wrap gap-2">
          {["AI", "CleanEnergy", "Web3", "HealthTech", "Robotics", "EdTech"].map((tag) => (
            <button 
              key={tag} 
              className="px-4 py-2 bg-white rounded-full text-xs font-bold text-foreground border border-muted hover:border-primary/30 transition-all shadow-sm"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-20 text-muted-foreground text-center px-10">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
           <SearchIcon size={24} className="opacity-20" />
        </div>
        <p className="text-sm font-bold uppercase tracking-tight">Start searching</p>
        <p className="text-[10px] font-medium leading-relaxed mt-1">
          Find people to collaborate with or ideas that need your expertise.
        </p>
      </div>
    </div>
  );
}

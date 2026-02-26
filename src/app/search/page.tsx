
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Filter, Users, Lightbulb, Globe, UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { IdeaCard } from "@/components/feed/idea-card";

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const db = useFirestore();

  const ideasRef = useMemoFirebase(() => (db ? collection(db, "ideas") : null), [db]);
  const profilesRef = useMemoFirebase(() => (db ? collection(db, "userProfiles") : null), [db]);
  const unionsRef = useMemoFirebase(() => (db ? collection(db, "unions") : null), [db]);

  const { data: allIdeas } = useCollection(ideasRef);
  const { data: allProfiles } = useCollection(profilesRef);
  const { data: allUnions } = useCollection(unionsRef);

  const handleSearch = () => {
    if (inputValue.trim()) {
      setSubmittedQuery(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setInputValue("");
    setSubmittedQuery("");
  };

  const filteredResults = useMemo(() => {
    const q = submittedQuery.toLowerCase().trim();
    if (!q) return { ideas: [], profiles: [], unions: [] };

    return {
      ideas: allIdeas?.filter(i => 
        i.title?.toLowerCase().includes(q) || 
        i.description?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.problem?.toLowerCase().includes(q) ||
        i.tags?.some((t: string) => t.toLowerCase().includes(q))
      ) || [],
      profiles: allProfiles?.filter(p => 
        p.username?.toLowerCase().includes(q) || 
        p.bio?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.interests?.some((i: string) => i.toLowerCase().includes(q))
      ) || [],
      unions: allUnions?.filter(u => 
        u.name?.toLowerCase().includes(q) || 
        u.description?.toLowerCase().includes(q) ||
        u.category?.toLowerCase().includes(q)
      ) || []
    };
  }, [submittedQuery, allIdeas, allProfiles, allUnions]);

  const hasResults = filteredResults.ideas.length > 0 || 
                     filteredResults.profiles.length > 0 || 
                     filteredResults.unions.length > 0;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background p-6 pb-24 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Global Search</h1>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Profiles • Ideas • Unions</p>
      </header>

      <div className="flex gap-2 sticky top-4 z-50">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Type and press Enter to search..." 
            className="pl-10 pr-10 h-14 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-primary/20 text-sm font-medium"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {inputValue && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Button 
          onClick={handleSearch}
          className="h-14 w-14 rounded-2xl shadow-xl bg-primary text-white"
        >
          <SearchIcon size={20} />
        </Button>
      </div>

      {!submittedQuery ? (
        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Discovery Hub</p>
            <h4 className="text-sm font-bold text-foreground">Find the next big thing. Search for "AI", "Green", "Tech", or any keyword.</h4>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Trending Tags</h3>
            <div className="flex flex-wrap gap-2">
              {["AI", "CleanEnergy", "Web3", "HealthTech", "Robotics", "EdTech"].map((tag) => (
                <button 
                  key={tag} 
                  onClick={() => {
                    setInputValue(tag);
                    setSubmittedQuery(tag);
                  }}
                  className="px-5 py-2.5 bg-white rounded-full text-xs font-black text-primary border border-muted hover:border-primary/30 transition-all shadow-sm uppercase tracking-tighter"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Results for "{submittedQuery}"</p>
            <button onClick={clearSearch} className="text-[10px] font-black uppercase text-secondary">Clear</button>
          </div>

          {/* PROFILES SECTION */}
          {filteredResults.profiles.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full inline-flex">
                <UserCircle size={14} /> Innovators ({filteredResults.profiles.length})
              </h3>
              <div className="space-y-3">
                {filteredResults.profiles.map(p => (
                  <Link key={p.id} href={`/profile/${p.username}`} className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-border/50 hover:border-primary transition-all">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={p.profilePictureUrl} />
                      <AvatarFallback>{p.username?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-foreground truncate">@{p.username}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 font-medium">{p.bio}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* UNIONS SECTION */}
          {filteredResults.unions.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2 bg-secondary/5 px-3 py-1.5 rounded-full inline-flex">
                <Globe size={14} /> Unions ({filteredResults.unions.length})
              </h3>
              <div className="space-y-3">
                {filteredResults.unions.map(u => (
                  <Link key={u.id} href={`/unions/${u.id}`} className="flex items-center gap-4 bg-white p-5 rounded-[2.5rem] shadow-sm border border-border/50 hover:border-secondary transition-all">
                    <Avatar className="h-12 w-12 rounded-2xl border-2 border-background shadow-sm">
                      <AvatarImage src={u.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-secondary/10 text-secondary font-black">{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-black truncate uppercase tracking-tight">{u.name}</h4>
                        <Badge variant="secondary" className="text-[8px] font-black bg-secondary/10 text-secondary border-none">{u.category}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 font-medium">{u.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* IDEAS SECTION */}
          {filteredResults.ideas.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full inline-flex">
                <Lightbulb size={14} /> Ideas ({filteredResults.ideas.length})
              </h3>
              <div className="space-y-8">
                {filteredResults.ideas.map(idea => (
                  <div key={idea.id} className="animate-in zoom-in-95 duration-300">
                    <IdeaCard idea={idea as any} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {!hasResults && (
            <div className="flex flex-col items-center justify-center pt-20 text-muted-foreground text-center px-10">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                 <SearchIcon size={32} className="opacity-10" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest">No innovations found</p>
              <p className="text-[10px] font-bold leading-relaxed mt-2 opacity-60">
                We couldn't find anything matching "{submittedQuery}". Try another keyword or check your spelling.
              </p>
              <Button variant="ghost" className="mt-6 font-black uppercase text-[10px]" onClick={clearSearch}>
                Reset Search
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

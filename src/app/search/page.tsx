
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Filter, Users, Lightbulb, Globe, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { IdeaCard } from "@/components/feed/idea-card";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const db = useFirestore();

  const ideasRef = useMemoFirebase(() => (db ? collection(db, "ideas") : null), [db]);
  const profilesRef = useMemoFirebase(() => (db ? collection(db, "userProfiles") : null), [db]);
  const unionsRef = useMemoFirebase(() => (db ? collection(db, "unions") : null), [db]);

  const { data: allIdeas } = useCollection(ideasRef);
  const { data: allProfiles } = useCollection(profilesRef);
  const { data: allUnions } = useCollection(unionsRef);

  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { ideas: [], profiles: [], unions: [] };

    return {
      ideas: allIdeas?.filter(i => 
        i.title?.toLowerCase().includes(query) || 
        i.description?.toLowerCase().includes(query) ||
        i.category?.toLowerCase().includes(query)
      ) || [],
      profiles: allProfiles?.filter(p => 
        p.username?.toLowerCase().includes(query) || 
        p.bio?.toLowerCase().includes(query)
      ) || [],
      unions: allUnions?.filter(u => 
        u.name?.toLowerCase().includes(query) || 
        u.description?.toLowerCase().includes(query) ||
        u.category?.toLowerCase().includes(query)
      ) || []
    };
  }, [searchQuery, allIdeas, allProfiles, allUnions]);

  const hasResults = filteredResults.ideas.length > 0 || 
                     filteredResults.profiles.length > 0 || 
                     filteredResults.unions.length > 0;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background p-6 pb-24 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Global Search</h1>
        <p className="text-xs text-muted-foreground font-bold">Search profiles, ideas, and groups</p>
      </header>

      <div className="flex gap-2 sticky top-4 z-50">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search keyword..." 
            className="pl-10 h-12 bg-white border-none rounded-2xl shadow-lg focus-visible:ring-primary/20 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none shadow-lg bg-white">
          <Filter size={20} className="text-muted-foreground" />
        </Button>
      </div>

      {!searchQuery ? (
        <div className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trending Topics</h3>
          <div className="flex flex-wrap gap-2">
            {["AI", "CleanEnergy", "Web3", "HealthTech", "Robotics", "EdTech"].map((tag) => (
              <button 
                key={tag} 
                onClick={() => setSearchQuery(tag)}
                className="px-4 py-2 bg-white rounded-full text-xs font-bold text-foreground border border-muted hover:border-primary/30 transition-all shadow-sm"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* PROFILES SECTION */}
          {filteredResults.profiles.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <UserCircle size={14} /> Innovators ({filteredResults.profiles.length})
              </h3>
              <div className="space-y-3">
                {filteredResults.profiles.map(p => (
                  <Link key={p.id} href={`/profile/${p.username}`} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border hover:border-primary transition-all">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={p.profilePictureUrl} />
                      <AvatarFallback>{p.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate">@{p.username}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{p.bio}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* UNIONS SECTION */}
          {filteredResults.unions.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Globe size={14} /> Unions ({filteredResults.unions.length})
              </h3>
              <div className="space-y-3">
                {filteredResults.unions.map(u => (
                  <Link key={u.id} href={`/unions/${u.id}`} className="flex items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm border hover:border-primary transition-all">
                    <Avatar className="h-10 w-10 rounded-xl">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold truncate uppercase tracking-tight">{u.name}</h4>
                        <Badge variant="secondary" className="text-[8px]">{u.category}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{u.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* IDEAS SECTION */}
          {filteredResults.ideas.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Lightbulb size={14} /> Ideas ({filteredResults.ideas.length})
              </h3>
              <div className="space-y-6">
                {filteredResults.ideas.map(idea => (
                  <IdeaCard key={idea.id} idea={idea as any} />
                ))}
              </div>
            </section>
          )}

          {!hasResults && (
            <div className="flex flex-col items-center justify-center pt-20 text-muted-foreground text-center px-10">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                 <SearchIcon size={24} className="opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-tight">No results found</p>
              <p className="text-[10px] font-medium leading-relaxed mt-1">
                Try searching for another keyword like "AI", "Green", or "Tech".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

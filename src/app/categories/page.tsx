
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, LayoutGrid, Sparkles, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";

export default function CategoriesPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData, isLoading } = useDoc(profileRef);

  const userCategories = profileData?.interests || [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background p-6 pb-24 space-y-8">
      <header className="flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Explore</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Your Innovation Hubs</p>
        </div>
      </header>

      {userCategories.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {userCategories.map((cat: string) => (
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
      ) : (
        <div className="py-20 text-center space-y-6">
          <div className="bg-primary/5 p-10 rounded-[3rem] border border-dashed border-primary/20">
            <LayoutGrid className="mx-auto text-primary/20 mb-4" size={48} />
            <p className="text-sm font-bold text-muted-foreground">No hubs selected yet.</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase mt-2">Personalize your feed to see categories here.</p>
          </div>
          <Link href="/setup">
            <Button className="rounded-full bg-primary text-white px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              Update Interests
            </Button>
          </Link>
        </div>
      )}

      <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10 text-center space-y-4">
        <LayoutGrid className="mx-auto text-primary opacity-30" size={40} />
        <h3 className="text-sm font-black uppercase tracking-tighter">Personal Hubs</h3>
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
          Select a category to see specialized innovations and memes from creators in your chosen hubs.
        </p>
      </div>
    </div>
  );
}

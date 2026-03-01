
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, LayoutGrid, Sparkles, Loader2, 
  GraduationCap, Cpu, Bot, Laptop, Rocket, Briefcase, Landmark, 
  IndianRupee, Globe, Heart, Brain, Zap, Fire, Users, Megaphone, 
  Vote, Newspaper, BookOpen, FlaskConical, Gamepad2, Film, Music, 
  Trophy, Laugh, PenTool, MessageSquare, Pencil, User, Smile, 
  Eye, Wand2, Monitor as Screen, Palette, Book, MessageCircle, Medal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";

const ICON_MAP: Record<string, any> = {
  "Education": GraduationCap,
  "Technology": Cpu,
  "AI & Tools": Bot,
  "App Development": Laptop,
  "Business & Startup": Rocket,
  "Career & Jobs": Briefcase,
  "Government Exams": Landmark,
  "Finance & Investment": IndianRupee,
  "Earning Online": Globe,
  "Health & Fitness": Heart,
  "Mental Health": Brain,
  "Self Improvement": Zap,
  "Motivation": Fire,
  "Relationships": Users,
  "Social Issues": Megaphone,
  "Politics": Vote,
  "Current Affairs": Newspaper,
  "History": BookOpen,
  "Science": FlaskConical,
  "Gaming": Gamepad2,
  "Movies & Web Series": Film,
  "Music": Music,
  "Sports": Trophy,
  "Memes": Laugh,
  "Stories & Shayari": PenTool,
  "Opinion / Debate": MessageSquare,
  "Pencil Sketch": Pencil,
  "Portrait Drawing": User,
  "Cartoon Drawing": Smile,
  "Realistic Drawing": Eye,
  "Doodle Art": Wand2,
  "Digital Art": Screen,
  "AI Art": Sparkles,
  "Painting": Palette,
  "Learn Drawing": Book,
  "Art Feedback": MessageCircle,
  "Art Competitions": Medal
};

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
        <div className="grid grid-cols-2 gap-4">
          {userCategories.map((cat: string) => {
            const Icon = ICON_MAP[cat] || Sparkles;
            return (
              <Button
                key={cat}
                variant="outline"
                className="h-36 rounded-[2.5rem] flex flex-col gap-4 border-muted/50 hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-sm bg-white"
                onClick={() => router.push(`/?category=${cat}`)}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2 leading-tight">
                  {cat}
                </span>
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-6">
          <div className="bg-primary/5 p-10 rounded-[3rem] border border-dashed border-primary/20">
            <LayoutGrid className="mx-auto text-primary/20 mb-4" size={48} />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No hubs selected yet.</p>
            <p className="text-[9px] text-muted-foreground/60 uppercase mt-2">Personalize your feed to see categories here.</p>
          </div>
          <Link href="/setup">
            <Button className="rounded-full bg-primary text-white px-10 h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              Update Interests
            </Button>
          </Link>
        </div>
      )}

      <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10 text-center space-y-4">
        <Sparkles className="mx-auto text-primary opacity-30" size={40} />
        <h3 className="text-sm font-black uppercase tracking-tighter text-primary">Personal Hubs</h3>
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed uppercase">
          Each hub represents a specialized world of innovation and creativity tailored to your chosen path.
        </p>
      </div>
    </div>
  );
}

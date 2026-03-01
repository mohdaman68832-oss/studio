
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, LayoutGrid, Sparkles, Loader2, 
  GraduationCap, Cpu, Bot, Laptop, Rocket, Briefcase, Landmark, 
  IndianRupee, Globe, Heart, Brain, Zap, Flame, Users, Megaphone, 
  Vote, Newspaper, BookOpen, FlaskConical, Gamepad2, Film, Music, 
  Trophy, Laugh, PenTool, MessageSquare, Pencil, User, Smile, 
  Eye, Wand2, Monitor as Screen, Palette, Book, MessageCircle, Medal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";

const ALL_CATEGORIES = [
  { name: "Education", icon: GraduationCap },
  { name: "Technology", icon: Cpu },
  { name: "AI & Tools", icon: Bot },
  { name: "App Development", icon: Laptop },
  { name: "Business & Startup", icon: Rocket },
  { name: "Career & Jobs", icon: Briefcase },
  { name: "Government Exams", icon: Landmark },
  { name: "Finance & Investment", icon: IndianRupee },
  { name: "Earning Online", icon: Globe },
  { name: "Health & Fitness", icon: Heart },
  { name: "Mental Health", icon: Brain },
  { name: "Self Improvement", icon: Zap },
  { name: "Motivation", icon: Flame },
  { name: "Relationships", icon: Users },
  { name: "Social Issues", icon: Megaphone },
  { name: "Politics", icon: Vote },
  { name: "Current Affairs", icon: Newspaper },
  { name: "History", icon: BookOpen },
  { name: "Science", icon: FlaskConical },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Movies & Web Series", icon: Film },
  { name: "Music", icon: Music },
  { name: "Sports", icon: Trophy },
  { name: "Memes", icon: Laugh },
  { name: "Stories & Shayari", icon: PenTool },
  { name: "Opinion / Debate", icon: MessageSquare },
  { name: "Pencil Sketch", icon: Pencil },
  { name: "Portrait Drawing", icon: User },
  { name: "Cartoon Drawing", icon: Smile },
  { name: "Realistic Drawing", icon: Eye },
  { name: "Doodle Art", icon: Wand2 },
  { name: "Digital Art", icon: Screen },
  { name: "AI Art", icon: Sparkles },
  { name: "Painting", icon: Palette },
  { name: "Learn Drawing", icon: Book },
  { name: "Art Feedback", icon: MessageCircle },
  { name: "Art Competitions", icon: Medal }
];

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
  "Motivation": Flame,
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

      {/* Show user's selected hubs first */}
      {userCategories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary px-1">Your Curated Hubs</h2>
          <div className="grid grid-cols-2 gap-4">
            {userCategories.map((cat: string) => {
              const Icon = ICON_MAP[cat] || Sparkles;
              return (
                <Button
                  key={cat}
                  variant="outline"
                  className="h-36 rounded-[2.5rem] flex flex-col gap-4 border-primary/20 bg-primary/5 hover:border-primary transition-all group shadow-sm"
                  onClick={() => router.push(`/?category=${cat}`)}
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center px-2 leading-tight">
                    {cat}
                  </span>
                </Button>
              );
            })}
          </div>
        </section>
      )}

      {/* Discovery Section: Show ALL categories */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Discover More Hubs</h2>
          <Link href="/setup" className="text-[9px] font-black uppercase text-secondary hover:underline">Edit Interests</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {ALL_CATEGORIES.filter(c => !userCategories.includes(c.name)).map((cat) => (
            <Button
              key={cat.name}
              variant="outline"
              className="h-32 rounded-[2.5rem] flex flex-col gap-3 border-muted/50 hover:border-primary/50 hover:bg-primary/5 transition-all group bg-white"
              onClick={() => router.push(`/?category=${cat.name}`)}
            >
              <div className="w-10 h-10 rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                <cat.icon size={20} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-center px-2 leading-tight">
                {cat.name}
              </span>
            </Button>
          ))}
        </div>
      </section>

      <div className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10 text-center space-y-4">
        <Sparkles className="mx-auto text-primary opacity-30" size={40} />
        <h3 className="text-sm font-black uppercase tracking-tighter text-primary">Global Innovation</h3>
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed uppercase">
          Explore specialized worlds of creativity. Each hub connects you with innovators sharing your vision.
        </p>
      </div>
    </div>
  );
}

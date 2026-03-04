
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Users, LayoutGrid, Check } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

const QUICK_CATEGORIES = ["Technology", "Art", "Sustainability", "Healthcare"];

const ALL_CATEGORIES = [
  "Education", "Technology", "AI & Tools", "App Development", "Business & Startup", 
  "Career & Jobs", "Government Exams", "Finance & Investment", "Earning Online", 
  "Health & Fitness", "Mental Health", "Self Improvement", "Motivation", 
  "Relationships", "Social Issues", "Politics", "Current Affairs", "History", 
  "Science", "Gaming", "Movies & Web Series", "Music", "Sports", 
  "Stories & Shayari", "Opinion / Debate", "Pencil Sketch", "Portrait Drawing", 
  "Cartoon Drawing", "Realistic Drawing", "Doodle Art", "Digital Art", "AI Art", 
  "Painting", "Learn Drawing", "Art Feedback", "Art Competitions"
];

export default function CreateGroupPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.description || !formData.category) {
      toast({
        title: "Missing Info",
        description: "Please fill in all details.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      await addDoc(collection(db, "groups"), {
        ...formData,
        memberCount: 1,
        createdBy: "User",
        avatarUrl: `https://picsum.photos/seed/${formData.name}/200/200`,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Group Formed!",
        description: `${formData.name} is now live in the Sphere.`,
      });
      router.push("/chat");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create group.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background p-6 pb-24 space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Form Group</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Establish a new community</p>
        </div>
      </header>

      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-border/50">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Group Name</Label>
          <Input 
            placeholder="e.g., AI Enthusiasts" 
            className="rounded-2xl h-12 bg-muted/30 border-none"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Mission</Label>
          <Textarea 
            placeholder="What will your group achieve?" 
            className="rounded-2xl min-h-[100px] bg-muted/30 border-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Category</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full text-[10px] font-black uppercase tracking-widest transition-all h-9 px-4",
                  formData.category === cat ? "bg-primary text-white border-primary" : "bg-transparent border-muted text-muted-foreground"
                )}
                onClick={() => setFormData({...formData, category: cat})}
              >
                {cat}
              </Button>
            ))}
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-secondary/5 h-9"
                >
                  <LayoutGrid size={14} className="mr-1.5" /> See All
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[3rem] h-[70vh] bg-background border-none shadow-2xl p-0 flex flex-col">
                <SheetHeader className="p-6 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10">
                  <SheetTitle className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-primary">Select Hub Category</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-12">
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_CATEGORIES.map((cat) => (
                      <Button
                        key={cat}
                        variant="outline"
                        className={cn(
                          "h-14 rounded-2xl flex items-center justify-between px-4 border-2 transition-all",
                          formData.category === cat ? "border-primary bg-primary/5 text-primary" : "border-muted/50 bg-white text-muted-foreground"
                        )}
                        onClick={() => {
                          setFormData({...formData, category: cat});
                          setIsSheetOpen(false);
                        }}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight truncate mr-2">{cat}</span>
                        {formData.category === cat && <Check size={14} />}
                      </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {formData.category && !QUICK_CATEGORIES.includes(formData.category) && (
            <div className="mt-2 animate-in fade-in slide-in-from-left-2">
              <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                Selected: {formData.category}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-xl text-primary flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Free Formation</p>
            <p className="text-sm font-bold text-foreground">Community Builder</p>
          </div>
        </div>
      </div>

      <Button 
        className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl hover:shadow-primary/20 transition-all text-sm"
        disabled={loading}
        onClick={handleCreate}
      >
        {loading ? (
          <Loader2 className="animate-spin mr-2" />
        ) : (
          `Create Group`
        )}
      </Button>

      <p className="text-[10px] text-center text-muted-foreground font-medium px-8">
        By creating a group, you agree to lead it responsibly and follow the community guidelines.
      </p>
    </div>
  );
}

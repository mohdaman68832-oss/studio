"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, ChevronRight, ChevronLeft, Camera, Image as ImageIcon, 
  Monitor, Smartphone, X, Sparkles,
  GraduationCap, Cpu, Bot, Laptop, Rocket, Briefcase, Landmark, 
  IndianRupee, Globe, Heart, Brain, Zap, Flame, Users, Megaphone, 
  Vote, Newspaper, BookOpen, FlaskConical, Gamepad2, Film, Music, 
  Trophy, Laugh, PenTool, MessageSquare, Pencil, User, Smile, 
  Eye, Wand2, Monitor as Screen, Palette, Book, MessageCircle, Medal
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const CATEGORIES = [
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

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function SetupPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [showBannerPreview, setShowBannerPreview] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.displayName) setNickname(user.displayName);
    if (user && user.photoURL) setProfilePic(user.photoURL);
  }, [user]);

  const handleCheckUsername = async () => {
    if (!username.trim()) {
      toast({ variant: "destructive", title: "Missing Username" });
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, "userProfiles"), where("username", "==", username.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "Taken!", description: "This username is already in use." });
        setLoading(false);
        return;
      }
      setStep(2);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setProfilePic(base64);
      else setBanner(base64);
    }
  };

  const toggleInterest = (cat: string) => {
    setInterests(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleFinish = async () => {
    if (!user || interests.length < 3) {
      toast({ variant: "destructive", title: "Pick 3 Hubs" });
      return;
    }
    setLoading(true);
    try {
      // REQUIREMENT: No stored postCount field.
      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        name: nickname,
        username: username.toLowerCase().trim(),
        email: user.email,
        bio: bio || "Just joined the Sphere!",
        profilePictureUrl: profilePic || `https://picsum.photos/seed/${user.uid}/200/200`,
        bannerUrl: banner || `https://picsum.photos/seed/banner${user.uid}/800/200`,
        interests,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Welcome!", description: "Profile setup complete." });
      router.push("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) return null;

  const progress = (step / 4) * 100;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 space-y-8 bg-background justify-center">
      {showBannerPreview && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b">
            <Button variant="ghost" size="icon" onClick={() => setShowBannerPreview(false)}><X /></Button>
            <h2 className="text-xs font-black uppercase tracking-widest">Banner Hub</h2>
            <div className="w-10" />
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground"><Monitor size={16} /><span className="text-[10px] font-bold uppercase">Desktop</span></div>
              <div className="relative aspect-[3/1] bg-muted rounded-2xl overflow-hidden shadow-xl">
                {banner && <Image src={banner} alt="PC Banner" fill className="object-cover" unoptimized />}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground"><Smartphone size={16} /><span className="text-[10px] font-bold uppercase">Mobile</span></div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[220px] aspect-[4/3] bg-muted rounded-3xl overflow-hidden shadow-2xl">
                  {banner && <Image src={banner} alt="Mobile Banner" fill className="object-cover" unoptimized />}
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-4">
               <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
               <Button onClick={() => bannerInputRef.current?.click()} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl">Upload Banner</Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Setup</h1>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2 bg-muted rounded-full" />
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Nickname</Label>
              <Input placeholder="Public Name" className="rounded-2xl h-14 bg-white font-bold" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Unique Username</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">@</span>
                <Input placeholder="username" className="rounded-2xl h-14 bg-white pl-8 lowercase font-black text-lg" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} />
              </div>
            </div>
          </div>
          <Button onClick={handleCheckUsername} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <>Continue <ChevronRight size={20} className="ml-2" /></>}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-6">
            <div onClick={() => setShowBannerPreview(true)} className="relative h-32 bg-muted rounded-[2rem] overflow-hidden group border-2 border-dashed cursor-pointer shadow-inner">
              {banner ? <Image src={banner} alt="Banner" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-muted-foreground/40"><ImageIcon size={28} /><span className="text-[9px] font-black uppercase">Set Banner</span></div>}
            </div>
            <div className="relative -mt-16 ml-6 w-24 h-24 rounded-[2rem] border-4 border-background bg-white overflow-hidden group shadow-2xl">
              {profilePic ? <Image src={profilePic} alt="Profile" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center"><Camera className="text-muted-foreground/20" size={32} /></div>}
              <button onClick={() => profileInputRef.current?.click()} className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={20} /></button>
              <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <Button onClick={() => setStep(3)} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl">Next <ChevronRight size={20} className="ml-2" /></Button>
            <Button variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(1)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase ml-1">Bio</Label>
            <Textarea placeholder="Mission statement..." className="rounded-[2.5rem] min-h-[180px] bg-white border-muted p-6 text-sm font-medium" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="space-y-3 pt-4">
            <Button onClick={() => setStep(4)} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl">Select Hubs <ChevronRight size={20} className="ml-2" /></Button>
            <Button variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(2)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 h-[65vh] flex flex-col">
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = interests.includes(cat.name);
              return (
                <button 
                  key={cat.name} 
                  onClick={() => toggleInterest(cat.name)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all gap-3 h-32",
                    isSelected 
                      ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" 
                      : "bg-white border-muted text-muted-foreground"
                  )}
                >
                  <Icon size={28} className={cn(isSelected ? "text-white" : "text-primary opacity-60")} />
                  <span className="text-[10px] font-black uppercase text-center leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>
          <div className="space-y-3 pt-6 border-t bg-background">
            <Button onClick={handleFinish} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-2xl" disabled={loading || interests.length < 3}>
              {loading ? <Loader2 className="animate-spin" /> : interests.length < 3 ? `Pick ${3 - interests.length} More` : "Launch Sphere"}
            </Button>
            <Button variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(3)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}
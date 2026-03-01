
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
import { Loader2, ChevronRight, ChevronLeft, Camera, Image as ImageIcon, Monitor, Smartphone, X, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const CATEGORIES = [
  "Education", "Technology", "AI & Tools", "App Development", "Business & Startup", 
  "Career & Jobs", "Government Exams", "Finance & Investment", "Earning Online", 
  "Health & Fitness", "Mental Health", "Self Improvement", "Motivation", 
  "Relationships", "Social Issues", "Politics", "Current Affairs", "History", 
  "Science", "Gaming", "Movies & Web Series", "Music", "Sports", "Memes", 
  "Stories & Shayari", "Opinion / Debate", "Pencil Sketch", "Portrait Drawing", 
  "Cartoon Drawing", "Realistic Drawing", "Doodle Art", "Digital Art", "AI Art", 
  "Painting", "Learn Drawing", "Art Feedback", "Art Competitions"
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
    if (user && user.displayName) {
      setNickname(user.displayName);
    }
    if (user && user.photoURL) {
      setProfilePic(user.photoURL);
    }
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
      toast({ variant: "destructive", title: "Pick 3 Categories" });
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        name: nickname,
        username: username.toLowerCase().trim(),
        email: user.email,
        bio: bio || "Just joined the Sphere!",
        profilePictureUrl: profilePic || `https://picsum.photos/seed/${user.uid}/200/200`,
        bannerUrl: banner || `https://picsum.photos/seed/banner${user.uid}/800/200`,
        interests,
        createdAt: new Date().toISOString(),
        totalIdeasPosted: 0,
        totalViewsReceived: 0,
        totalIdeasSaved: 0
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
              <div className="flex items-center gap-2 text-muted-foreground"><Monitor size={16} /><span className="text-[10px] font-bold uppercase">PC Preview</span></div>
              <div className="relative aspect-[3/1] bg-muted rounded-xl overflow-hidden border shadow-inner">
                {banner && <Image src={banner} alt="PC Banner" fill className="object-cover" unoptimized />}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground"><Smartphone size={16} /><span className="text-[10px] font-bold uppercase">Mobile Preview</span></div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[200px] aspect-[4/3] bg-muted rounded-xl overflow-hidden border shadow-inner">
                  {banner && <Image src={banner} alt="Mobile Banner" fill className="object-cover" unoptimized />}
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-4">
               <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
               <Button onClick={() => bannerInputRef.current?.click()} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase tracking-widest">Upload Banner</Button>
               {banner && <Button variant="outline" onClick={() => setShowBannerPreview(false)} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest border-primary text-primary">Save View</Button>}
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Profile Setup</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Personalize your Sphere identity</p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-1.5 bg-muted" />
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
          <span className={step >= 1 ? "text-primary" : ""}>Identity</span>
          <span className={step >= 2 ? "text-primary" : ""}>Style</span>
          <span className={step >= 3 ? "text-primary" : ""}>Expertise</span>
          <span className={step >= 4 ? "text-primary" : ""}>Interests</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nickname (Public)</Label>
              <Input placeholder="John Doe" className="rounded-2xl h-12 bg-white" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Unique Username</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">@</span>
                <Input placeholder="innovator" className="rounded-2xl h-12 bg-white pl-8 lowercase" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} />
              </div>
            </div>
          </div>
          <Button onClick={handleCheckUsername} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <>Next <ChevronRight size={18} className="ml-2" /></>}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div onClick={() => setShowBannerPreview(true)} className="relative h-24 bg-muted rounded-2xl overflow-hidden group border border-dashed border-primary/20 cursor-pointer">
              {banner ? <Image src={banner} alt="Banner" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center flex-col gap-1 text-muted-foreground/40"><ImageIcon /><span className="text-[8px] font-black uppercase">Tap to set Banner</span></div>}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera /></div>
            </div>
            <div className="relative -mt-12 ml-4 w-20 h-20 rounded-full border-4 border-background bg-muted overflow-hidden group shadow-lg">
              {profilePic ? <Image src={profilePic} alt="Profile" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center"><Camera className="text-muted-foreground/40" /></div>}
              <button onClick={() => profileInputRef.current?.click()} className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={16} /></button>
              <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            </div>
            <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-widest">Tap camera to upload Logo/Avatar</p>
          </div>
          <div className="space-y-3 pt-4">
            <Button onClick={() => setStep(3)} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl">Bio & Story <ChevronRight size={18} className="ml-2" /></Button>
            <Button variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(1)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">About Your Innovation Journey</Label>
            <Textarea placeholder="What motivates you to create?" className="rounded-2xl min-h-[140px] bg-white border-muted" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="space-y-3 pt-4">
            <Button onClick={() => setStep(4)} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl">Final Step: Hubs <ChevronRight size={18} className="ml-2" /></Button>
            <Button variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(2)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 h-[60vh] flex flex-col">
          <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex items-center gap-3">
            <Sparkles className="text-primary" />
            <p className="text-[10px] font-black uppercase text-primary leading-tight">Pick 3 or more interest hubs.</p>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <Button 
                key={cat} 
                variant="outline" 
                className={cn(
                  "rounded-2xl h-14 text-[9px] font-black uppercase tracking-widest transition-all", 
                  interests.includes(cat) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-muted/50"
                )} 
                onClick={() => toggleInterest(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="space-y-3 pt-6 border-t bg-background">
            <Button onClick={handleFinish} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" disabled={loading || interests.length < 3}>
              {loading ? <Loader2 className="animate-spin" /> : interests.length < 3 ? `Pick ${3 - interests.length} More` : "Launch Sphere"}
            </Button>
            <Button variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(3)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}

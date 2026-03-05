
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, ChevronRight, ChevronLeft, Camera, Image as ImageIcon, 
  Briefcase, Monitor, Smartphone, X, Sparkles, ShieldCheck, AlertTriangle,
  GraduationCap, Cpu, Bot, Laptop, Rocket, Landmark, 
  IndianRupee, Globe, Heart, Brain, Zap, Flame, Users, Megaphone, 
  Vote, Newspaper, BookOpen, FlaskConical, Gamepad2, Film, Music, 
  Trophy, Laugh, PenTool, MessageSquare, Pencil, User, Smile, 
  Eye, Wand2, Monitor as Screen, Palette, Book, MessageCircle, Medal
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4;

const HUB_OPTIONS = [
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

export default function SignupPage() {
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "At least 6 characters required." });
      return;
    }
    setStep(2);
  };

  const handleCheckUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const q = query(collection(db, "userProfiles"), where("username", "==", username.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "Username Taken", description: `@${username} is already in use.` });
        setLoading(false);
        return;
      }
      setStep(3);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        if (type === 'profile') setProfilePic(base64);
        else { setBanner(base64); setShowBannerEditor(false); }
      } catch (err) {
        toast({ variant: "destructive", title: "Process Failed", description: "Image processing error." });
      }
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleSignup = async () => {
    if (interests.length < 3) {
      toast({ title: "Pick 3 Hubs", description: "Customize your feed with 3 categories.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        username: username.toLowerCase().trim(),
        email: email,
        profilePictureUrl: profilePic || `https://picsum.photos/seed/${user.uid}/200/200`,
        bannerUrl: banner || `https://picsum.photos/seed/banner${user.uid}/800/200`,
        bio: bio || "Just joined InnovateSphere!",
        interests: interests,
        createdAt: new Date().toISOString(),
        totalIdeasPosted: 0,
        totalViewsReceived: 0,
        totalIdeasSaved: 0
      });

      toast({ title: "Welcome!", description: `Profile @${username} launched.` });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 space-y-8 bg-background justify-center">
      {showBannerEditor && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b bg-white/80 backdrop-blur-md">
            <Button variant="ghost" size="icon" onClick={() => setShowBannerEditor(false)}><X size={20} /></Button>
            <h2 className="text-xs font-black uppercase tracking-widest">Banner Hub</h2>
            <div className="w-10" />
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground"><Monitor size={16} /><span className="text-[10px] font-bold uppercase">Desktop View</span></div>
              <div className="relative aspect-[3/1] w-full bg-muted rounded-[2rem] overflow-hidden border-2 border-primary/10 shadow-xl">
                {banner ? <Image src={banner} alt="PC Banner" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon size={40} /></div>}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground"><Smartphone size={16} /><span className="text-[10px] font-bold uppercase">Mobile View</span></div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[220px] aspect-[4/3] bg-muted rounded-[2.5rem] overflow-hidden border-2 border-primary/10 shadow-2xl">
                  {banner ? <Image src={banner} alt="Mobile Banner" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon size={30} /></div>}
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-4">
               <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
               <Button onClick={() => bannerInputRef.current?.click()} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest">Upload Hub Banner</Button>
               {banner && <Button variant="outline" onClick={() => setShowBannerEditor(false)} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest border-primary text-primary">Save Preview</Button>}
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Join Sphere</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Start your innovation journey</p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2 bg-muted rounded-full" />
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
          <span className={step >= 0 ? "text-primary" : ""}>Rules</span>
          <span className={step >= 1 ? "text-primary" : ""}>Info</span>
          <span className={step >= 2 ? "text-primary" : ""}>Handle</span>
          <span className={step >= 3 ? "text-primary" : ""}>Style</span>
          <span className={step >= 4 ? "text-primary" : ""}>Hubs</span>
        </div>
      </div>

      {step === 0 && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10 space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck size={28} className="text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-primary">Sphere Covenant</h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} /> Account Deletion
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                    Aapka account bina kisi purv suchna ke delete kiya ja sakta hai agar aap:
                  </p>
                  <ul className="text-[10px] font-bold text-foreground space-y-1 list-disc pl-4">
                    <li>Hate speech ya bullying karte hain.</li>
                    <li>Illegal ya offensive content share karte hain.</li>
                    <li>Multiple valid reports prapt karte hain.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">Forbidden Content</p>
                  <ul className="text-[10px] font-bold text-foreground space-y-1 list-disc pl-4">
                    <li>Adult/Explicit media (Photos/Videos).</li>
                    <li>Violence ya dangerous activities ka prachar.</li>
                    <li>Spamming ya misleading information.</li>
                  </ul>
                </div>
              </div>

              <p className="text-[9px] font-medium italic text-muted-foreground pt-4 border-t opacity-60">
                By continuing, you agree to respect the Sphere community.
              </p>
           </div>
           <Button onClick={() => setStep(1)} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl">
             I Accept the Covenant <ChevronRight size={20} className="ml-2" />
           </Button>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-4 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label><Input placeholder="John Innovator" className="rounded-2xl h-14 bg-white border-muted shadow-sm font-bold" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Hub</Label><Input type="email" placeholder="innovator@sphere.com" className="rounded-2xl h-14 bg-white border-muted shadow-sm font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Secure Password</Label><Input type="password" placeholder="••••••••" className="rounded-2xl h-14 bg-white border-muted shadow-sm font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button type="submit" className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl hover:shadow-primary/20">Next <ChevronRight size={20} className="ml-2" /></Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleCheckUsername} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/10">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Identity Check</p>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase">Your username is your unique handle in the innovation sphere. Choose wisely.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Unique Username</Label>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">@</span><Input placeholder="innovator123" className="rounded-2xl h-14 bg-white border-muted pl-8 font-black text-lg lowercase" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} required /></div>
            </div>
          </div>
          <div className="space-y-3">
            <Button type="submit" className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2" /> : <>Continue <ChevronRight size={20} className="ml-2" /></>}</Button>
            <Button type="button" variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(1)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
          <div className="space-y-6">
            <div onClick={() => setShowBannerEditor(true)} className="relative h-32 bg-muted rounded-[2rem] overflow-hidden group border-2 border-dashed border-primary/20 cursor-pointer shadow-inner">
              {banner ? <Image src={banner} alt="Banner" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center flex-col gap-2"><ImageIcon className="text-muted-foreground/40" size={28} /><span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Set Profile Banner</span></div>}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={20} /></div>
            </div>
            <div className="relative -mt-16 ml-6 w-24 h-24 rounded-[2rem] border-4 border-background bg-white overflow-hidden group shadow-2xl">
              {profilePic ? <Image src={profilePic} alt="Profile" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center"><Camera className="text-muted-foreground/20" size={32} /></div>}
              <button onClick={() => profileInputRef.current?.click()} className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={20} /></button>
              <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Innovation Bio</Label><Textarea placeholder="Tell us about your background, skills, and what you aim to build..." className="rounded-[2rem] h-32 bg-white border-muted shadow-inner p-5 text-sm font-medium" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
          </div>
          <div className="space-y-3 pt-4">
            <Button onClick={() => setStep(4)} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-xl">Final Step <ChevronRight size={20} className="ml-2" /></Button>
            <Button type="button" variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(2)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 h-[65vh] flex flex-col">
          <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/10 flex items-center gap-4">
            <Sparkles className="text-primary shrink-0" size={24} />
            <div>
              <p className="text-[11px] font-black uppercase text-primary leading-tight">Curate Your Sphere</p>
              <p className="text-[9px] font-medium text-muted-foreground uppercase mt-0.5">Select 3 or more interest hubs</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 grid grid-cols-2 gap-3 px-1">
            {HUB_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = interests.includes(opt.name);
              return (
                <button 
                  key={opt.name} 
                  onClick={() => toggleInterest(opt.name)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all gap-3 h-32",
                    isSelected 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-white border-muted/50 hover:border-primary/30 text-muted-foreground"
                  )}
                >
                  <Icon size={28} className={cn(isSelected ? "text-white" : "text-primary opacity-60")} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight">
                    {opt.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-6 border-t bg-background">
            <Button onClick={handleSignup} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase shadow-2xl hover:scale-[1.02] transition-transform" disabled={loading || interests.length < 3}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : interests.length < 3 ? `Pick ${3 - interests.length} More` : "Launch My Sphere"}
            </Button>
            <Button type="button" variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(3)}><ChevronLeft size={14} className="mr-1" /> Back</Button>
          </div>
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground font-bold pb-4">Already an innovator? <Link href="/login" className="text-secondary font-black uppercase hover:underline">Sign In</Link></p>
    </div>
  );
}

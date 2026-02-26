
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
import { Loader2, ChevronRight, ChevronLeft, Check, Camera, Image as ImageIcon, Briefcase } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const EXPERTISE_OPTIONS = [
  "Art", "Game", "Study", "Technology", "Sustainability", "Healthcare", "Business", "Education", "Science", "Music"
];

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
      });
      return;
    }
    setStep(2);
  };

  const handleCheckUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const usersRef = collection(db, "userProfiles");
      const q = query(usersRef, where("username", "==", username.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Username Taken",
          description: `The username "@${username}" is already in use.`,
        });
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'profile') setProfilePic(url);
      else setBanner(url);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Auth Profile
      await updateProfile(user, { 
        displayName: name,
        photoURL: profilePic || `https://picsum.photos/seed/${user.uid}/200/200`
      });

      // 3. Create User Profile in Firestore
      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        username: username.toLowerCase().trim(),
        email: email,
        profilePictureUrl: profilePic || `https://picsum.photos/seed/${user.uid}/200/200`,
        bannerUrl: banner || `https://picsum.photos/seed/banner${user.uid}/800/200`,
        bio: bio || "Just joined InnovateSphere!",
        interests: interests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalIdeasPosted: 0,
        totalViewsReceived: 0,
        averageRatingReceived: 0,
        totalIdeasSaved: 0,
        collaborationRequestsCount: 0
      });

      toast({
        title: "Welcome to the Sphere!",
        description: `Account created successfully for @${username}.`,
      });
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 space-y-8 bg-background justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Join Sphere</h1>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
          {step === 1 && "Start your journey"}
          {step === 2 && "Choose your identity"}
          {step === 3 && "Personalize your profile"}
        </p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-1.5 bg-muted" />
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          <span className={step >= 1 ? "text-primary" : ""}>Account Info</span>
          <span className={step >= 2 ? "text-primary" : ""}>Username</span>
          <span className={step >= 3 ? "text-primary" : ""}>Profile</span>
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label>
            <Input 
              placeholder="John Innovator" 
              className="rounded-2xl h-12 bg-white border-muted"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Address</Label>
            <Input 
              type="email" 
              placeholder="innovator@sphere.com" 
              className="rounded-2xl h-12 bg-white border-muted"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="rounded-2xl h-12 bg-white border-muted"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl">
            Next <ChevronRight size={18} className="ml-2" />
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleCheckUsername} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-[2rem] border border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Identity Check</p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Your username is unique. Pick something that represents your brand of innovation.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Unique Username</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">@</span>
                <Input 
                  placeholder="innovator123" 
                  className="rounded-2xl h-12 bg-white border-muted pl-8 font-bold lowercase"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Button type="submit" className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <>Next <ChevronRight size={18} className="ml-2" /></>}
            </Button>
            <Button type="button" variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(1)}>
              <ChevronLeft size={14} className="mr-1" /> Back
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
          <div className="space-y-4">
            <div className="relative h-24 bg-muted rounded-2xl overflow-hidden group border border-dashed border-primary/20">
              {banner ? (
                <Image src={banner} alt="Banner" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <ImageIcon className="text-muted-foreground/40" />
                </div>
              )}
              <button 
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <Camera size={20} />
              </button>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            </div>

            <div className="relative -mt-12 ml-4 w-20 h-20 rounded-full border-4 border-background bg-muted overflow-hidden group shadow-lg">
              {profilePic ? (
                <Image src={profilePic} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="text-muted-foreground/40" />
                </div>
              )}
              <button 
                onClick={() => profileInputRef.current?.click()}
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <Camera size={16} />
              </button>
              <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">About Your Expertise</Label>
              <Textarea 
                placeholder="Tell us about your background and skills..." 
                className="rounded-2xl h-24 bg-white border-muted"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                <Briefcase size={12} /> Choose Your Fields
              </Label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                      interests.includes(opt) ? "bg-primary text-white border-primary" : "bg-white"
                    )}
                    onClick={() => toggleInterest(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button onClick={handleSignup} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Account Creation"}
            </Button>
            <Button type="button" variant="ghost" className="w-full h-10 font-bold uppercase text-[10px]" onClick={() => setStep(2)}>
              <ChevronLeft size={14} className="mr-1" /> Back
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground font-bold pb-4">
        Already an innovator?{" "}
        <Link href="/login" className="text-secondary font-black uppercase hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

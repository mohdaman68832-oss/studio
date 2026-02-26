
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

type Step = 1 | 2;

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleNextStep = (e: React.FormEvent) => {
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setCheckingUsername(true);

    try {
      // 1. Check if username is unique
      const usersRef = collection(db, "userProfiles");
      const q = query(usersRef, where("username", "==", username.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Username Taken",
          description: `The username "@${username}" is already in use. Please pick another one.`,
        });
        setLoading(false);
        setCheckingUsername(false);
        return;
      }

      setCheckingUsername(false);

      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Update Auth Profile
      await updateProfile(user, { displayName: name });

      // 4. Create User Profile in Firestore
      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        username: username.toLowerCase().trim(),
        email: email,
        profilePictureUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
        bio: "Just joined InnovateSphere!",
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
      setCheckingUsername(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center p-6 space-y-8 bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Join Sphere</h1>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
          {step === 1 ? "Start your journey" : "Choose your identity"}
        </p>
      </div>

      <div className="space-y-2">
        <Progress value={step === 1 ? 50 : 100} className="h-1.5 bg-muted" />
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Account Info</span>
          <span>Username</span>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label>
            <Input 
              type="text" 
              placeholder="John Innovator" 
              className="rounded-2xl h-12 bg-white border-muted focus-visible:ring-primary/20"
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
              className="rounded-2xl h-12 bg-white border-muted focus-visible:ring-primary/20"
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
              className="rounded-2xl h-12 bg-white border-muted focus-visible:ring-primary/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            Next Step <ChevronRight size={18} className="ml-2" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-[2rem] border border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Identity Check</p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Your username is your unique ID in the Sphere. Once chosen, others cannot use it.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Unique Username</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">@</span>
                <Input 
                  type="text" 
                  placeholder="innovator123" 
                  className="rounded-2xl h-12 bg-white border-muted pl-8 focus-visible:ring-primary/20 font-bold lowercase"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  required
                />
              </div>
              <p className="text-[9px] text-muted-foreground ml-1">No spaces allowed. Use only letters and numbers.</p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              disabled={loading || !username.trim()}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <>Complete Signup <Check size={18} className="ml-2" /></>
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost"
              className="w-full h-10 font-bold uppercase text-[10px] text-muted-foreground"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              <ChevronLeft size={14} className="mr-1" /> Back to Account Info
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground font-bold">
        Already have an account?{" "}
        <Link href="/login" className="text-secondary font-black uppercase hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

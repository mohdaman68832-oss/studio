
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Create User Profile in Firestore
      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        username: name.toLowerCase().replace(/\s/g, "") + Math.floor(Math.random() * 1000),
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
        title: "Account Created!",
        description: "Welcome to InnovateSphere, " + name + "!",
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

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center p-6 space-y-8 bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Join Sphere</h1>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Start your innovation journey</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
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
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground font-bold">
        Already have an account?{" "}
        <Link href="/login" className="text-secondary font-black uppercase hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

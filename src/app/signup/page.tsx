
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
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
        <p className="text-sm text-muted-foreground font-medium">Start your innovation journey today</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label>
          <Input 
            type="text" 
            placeholder="John Innovator" 
            className="rounded-2xl h-12 bg-muted/30 border-none"
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
            className="rounded-2xl h-12 bg-muted/30 border-none"
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
            className="rounded-2xl h-12 bg-muted/30 border-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button 
          type="submit" 
          className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase shadow-lg shadow-primary/20"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground font-medium">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-black uppercase hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

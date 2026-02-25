"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ShieldCheck, Loader2, Coins } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const UNION_PRICE = 500; // Simulated price in "paise" or coins

export default function CreateUnionPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
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
      // Simulate Payment/Deduction
      await new Promise(resolve => setTimeout(resolve, 1500));

      await addDoc(collection(db, "unions"), {
        ...formData,
        memberCount: 1,
        createdBy: "John Innovator",
        avatarUrl: `https://picsum.photos/seed/${formData.name}/200/200`,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Union Formed!",
        description: `${formData.name} is now live in the Sphere.`,
      });
      router.push("/chat");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create union.",
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
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Form Union</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Establish a new community</p>
        </div>
      </header>

      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-border/50">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Union Name</Label>
          <Input 
            placeholder="e.g., Space Explorers" 
            className="rounded-2xl h-12 bg-muted/30 border-none"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Purpose/Mission</Label>
          <Textarea 
            placeholder="What will your union achieve?" 
            className="rounded-2xl min-h-[100px] bg-muted/30 border-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Category</Label>
          <div className="flex flex-wrap gap-2">
            {["Technology", "Art", "Sustainability", "Healthcare"].map((cat) => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  formData.category === cat ? "bg-primary text-white border-primary" : "bg-transparent border-muted text-muted-foreground"
                )}
                onClick={() => setFormData({...formData, category: cat})}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-secondary/10 p-6 rounded-[2.5rem] border border-secondary/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-secondary p-2 rounded-xl text-white">
            <Coins size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-secondary">Formation Fee</p>
            <p className="text-lg font-black text-foreground">{UNION_PRICE} InnovateCoins</p>
          </div>
        </div>
        <ShieldCheck className="text-secondary opacity-20" size={32} />
      </div>

      <Button 
        className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl hover:shadow-primary/20 transition-all text-sm"
        disabled={loading}
        onClick={handleCreate}
      >
        {loading ? (
          <Loader2 className="animate-spin mr-2" />
        ) : (
          `Pay & Create Union`
        )}
      </Button>

      <p className="text-[10px] text-center text-muted-foreground font-medium px-8">
        By creating a union, you agree to lead it responsibly and follow the innovation sphere guidelines.
      </p>
    </div>
  );
}

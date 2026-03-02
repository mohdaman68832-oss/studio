"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  ImageIcon, 
  Type, 
  Video as VideoIcon, 
  X,
  Send,
  Tags
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

type Step = 1 | 2 | 3;

const CATEGORY_KEYWORDS = [
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

function PostFormContent() {
  const [step, setStep] = useState<Step>(1);
  const [isPosting, setIsPosting] = useState(false);
  const [mediaType, setMediaType] = useState<"text" | "image" | "video" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  const [isVideoSheetOpen, setIsVideoSheetOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("Technology");
  const [formData, setFormData] = useState({ title: "", problem: "", description: "" });

  useEffect(() => {
    const type = searchParams.get("mediaType") as any;
    const cat = searchParams.get("category");
    if (type && ["text", "image", "video"].includes(type)) {
      setMediaType(type);
      if (type === "text") setStep(2);
    }
    if (cat) setCategory(cat);
  }, [searchParams]);

  const handleMediaSelect = (type: "text" | "image" | "video") => {
    setMediaType(type);
    if (type === "text") {
      setPreviewUrl(null);
      setStep(2);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        setPreviewUrl(base64);
        setMediaType(type);
        if (type === "image") setIsImageSheetOpen(false);
        if (type === "video") setIsVideoSheetOpen(false);
      } catch (err) {
        toast({ variant: "destructive", title: "Process Failed", description: "Image processing error." });
      }
    }
  };

  const handlePublish = async () => {
    if (!db || !user) {
      toast({ variant: "destructive", title: "Auth Required", description: "Please log in to post." });
      return;
    }
    
    setIsPosting(true);
    try {
      // REQUIREMENT: Perform ONLY ONE write operation inside the "posts" collection.
      // DO NOT update userProfile or increment count here.
      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        username: user.displayName || "Innovator",
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        title: formData.title,
        problem: formData.problem,
        description: formData.description,
        content: formData.description,
        category: category,
        mediaUrl: mediaType === 'text' ? "" : (previewUrl || ""),
        createdAt: serverTimestamp(),
        mediaType: mediaType || "text",
        innovationScore: Math.floor(Math.random() * 30) + 70,
        likes: 0
      });

      toast({ title: "Success!", description: "Innovation published!" });
      setStep(3);
    } catch (error: any) {
      console.error("Posting Error:", error);
      toast({ variant: "destructive", title: "Posting Failed", description: "Check permissions or network." });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 pb-24 space-y-6 bg-background min-h-screen">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
           <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">New Post</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                {step === 3 ? "Complete" : `Step ${step} of 2`}
            </p>
           </div>
           {step === 2 && (
             <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="rounded-full text-[10px] font-black uppercase tracking-widest">
               <ChevronLeft className="w-4 h-4 mr-1" /> Back
             </Button>
           )}
        </header>
        <Progress value={(step / 3) * 100} className="h-1.5 bg-muted" />
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-3 gap-3">
              <Sheet open={isImageSheetOpen} onOpenChange={setIsImageSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className={cn("h-32 flex-col gap-2 rounded-[2rem] border-2", mediaType === 'image' && 'border-primary bg-primary/5')} onClick={() => handleMediaSelect("image")}>
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Image</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[35vh]">
                  <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "image")} />
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-10 h-12 font-black uppercase text-[10px] bg-primary text-white">Choose Photo</Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={isVideoSheetOpen} onOpenChange={setIsVideoSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className={cn("h-32 flex-col gap-2 rounded-[2rem] border-2", mediaType === 'video' && 'border-primary bg-primary/5')} onClick={() => handleMediaSelect("video")}>
                    <VideoIcon className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Video</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[35vh]">
                  <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, "video")} />
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-10 h-12 font-black uppercase text-[10px] bg-secondary text-white">Choose Video</Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" className={cn("h-32 flex-col gap-2 rounded-[2rem] border-2", mediaType === 'text' && 'border-primary bg-primary/5')} onClick={() => handleMediaSelect("text")}>
                <Type className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-widest">Text Only</span>
              </Button>
          </div>

          {previewUrl && (
            <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border-2 border-primary/20 shadow-2xl">
              {mediaType === 'video' ? <video src={previewUrl} className="w-full h-full object-cover" controls /> : <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />}
              <Button size="icon" variant="destructive" className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-lg" onClick={() => {setPreviewUrl(null); setMediaType(null);}}><X size={20} /></Button>
            </div>
          )}

          <Button className="w-full h-14 rounded-3xl text-sm font-black uppercase bg-primary text-white" disabled={!mediaType || (mediaType !== 'text' && !previewUrl)} onClick={() => setStep(2)}>
            Details <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Title</Label>
            <Input placeholder="Post title..." className="rounded-2xl h-14 bg-muted/30 border-none font-bold" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            
            <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-1"><Tags size={14} className="text-primary" /> Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_KEYWORDS.slice(0, 8).map((keyword) => (
                <Button key={keyword} variant="outline" size="sm" onClick={() => setCategory(keyword)} className={cn("rounded-full text-[9px] font-black uppercase h-9 px-4", category === keyword ? "bg-primary text-white" : "bg-white")}>
                  {keyword}
                </Button>
              ))}
            </div>

            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Challenge</Label>
            <Input placeholder="What problem are you solving?" className="rounded-2xl h-14 bg-muted/30 border-none font-bold" value={formData.problem} onChange={(e) => setFormData({...formData, problem: e.target.value})} />
            
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Description</Label>
            <Textarea placeholder="Details..." className="rounded-2xl min-h-[140px] bg-muted/30 border-none font-medium" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>

          <Button className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase" onClick={handlePublish} disabled={isPosting || !formData.title || !formData.description}>
            {isPosting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Posting...</> : <><Send className="mr-2 h-5 w-5" /> Publish</>}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto"><Loader2 className="w-10 h-10 text-primary" /></div>
          <h2 className="text-2xl font-black uppercase text-primary">Live Now</h2>
          <Button className="w-full h-14 rounded-3xl font-black uppercase bg-primary text-white" onClick={() => router.push("/")}>Back to Feed</Button>
        </div>
      )}
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}>
      <PostFormContent />
    </Suspense>
  );
}
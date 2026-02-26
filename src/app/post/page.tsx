
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Image as ImageIcon, 
  Type, 
  Video, 
  X,
  Send
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
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3;

const AUDIENCE_KEYWORDS = [
  "Meme", "Art", "Game", "Study", "Technology", "Sustainability", "Healthcare", "Business", "Education", "Science", "Music"
];

export default function PostPage() {
  const [step, setStep] = useState<Step>(1);
  const [isPosting, setIsPosting] = useState(false);
  const [mediaType, setMediaType] = useState<"text" | "image" | "video" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  const [isVideoSheetOpen, setIsVideoSheetOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    problem: "",
    description: "",
    targetUsers: "Meme", // Default to Meme
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMediaSelect = (type: "text" | "image" | "video") => {
    setMediaType(type);
    if (type === "text") {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMediaType(type);
      // Auto-close the sheet after selection
      if (type === "image") setIsImageSheetOpen(false);
      if (type === "video") setIsVideoSheetOpen(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    updateFormData("targetUsers", keyword);
  };

  const handleNext = () => {
    if (step < 2) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handlePublish = async () => {
    if (!db) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, "ideas"), {
        title: formData.title,
        problem: formData.problem,
        description: formData.description,
        category: formData.targetUsers || "Meme",
        userName: "John Innovator",
        userAvatar: "https://picsum.photos/seed/me/100/100",
        mediaUrl: mediaType === 'text' ? "" : (previewUrl || "https://picsum.photos/seed/placeholder/800/800"),
        innovationScore: 75,
        tags: [formData.targetUsers, "User-Generated"],
        createdAt: serverTimestamp(),
        likes: 0
      });

      toast({
        title: "Success!",
        description: "Your innovation has been published to the Sphere.",
      });

      setStep(3);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Posting Failed",
        description: "Something went wrong while publishing your idea.",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="max-w-md mx-auto p-6 pb-24 space-y-6 bg-background min-h-screen">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
           <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">New Post</h1>
            <p className="text-xs text-muted-foreground font-bold">Step {step === 3 ? 3 : step} of 2</p>
           </div>
           {step === 2 && (
             <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full text-xs font-bold uppercase">
               <ChevronLeft className="w-4 h-4 mr-1" /> Back
             </Button>
           )}
        </header>
        <Progress value={progress} className="h-1.5 bg-muted" />
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center block">Choose Your Format</Label>
            <div className="grid grid-cols-3 gap-3">
              <Sheet open={isImageSheetOpen} onOpenChange={setIsImageSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                        "h-32 flex-col gap-2 rounded-[2rem] border-2 transition-all",
                        mediaType === 'image' ? 'border-primary bg-primary/5' : 'border-muted'
                    )}
                    onClick={() => handleMediaSelect("image")}
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Image</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[35vh]">
                  <SheetHeader>
                    <SheetTitle className="text-center text-sm font-black uppercase">
                      Upload Image
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, "image")} 
                    />
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                       <Upload className="text-muted-foreground" />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-8 font-bold uppercase text-xs">
                      Choose File
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={isVideoSheetOpen} onOpenChange={setIsVideoSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                        "h-32 flex-col gap-2 rounded-[2rem] border-2 transition-all",
                        mediaType === 'video' ? 'border-primary bg-primary/5' : 'border-muted'
                    )}
                    onClick={() => handleMediaSelect("video")}
                  >
                    <Video className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Video</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[35vh]">
                  <SheetHeader>
                    <SheetTitle className="text-center text-sm font-black uppercase">
                      Upload Video
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="video/*" 
                      onChange={(e) => handleFileChange(e, "video")} 
                    />
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                       <Upload className="text-muted-foreground" />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-8 font-bold uppercase text-xs">
                      Choose Video
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button 
                variant="outline" 
                className={cn(
                    "h-32 flex-col gap-2 rounded-[2rem] border-2 transition-all",
                    mediaType === 'text' ? 'border-primary bg-primary/5' : 'border-muted'
                )}
                onClick={() => handleMediaSelect("text")}
              >
                <Type className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Text Only</span>
              </Button>
            </div>
          </div>

          {previewUrl && (mediaType === 'image' || mediaType === 'video') && (
            <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border shadow-lg animate-in zoom-in-95">
              {mediaType === 'video' ? (
                <video src={previewUrl} className="w-full h-full object-cover" controls />
              ) : (
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              )}
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute top-3 right-3 rounded-full h-8 w-8"
                onClick={() => {setPreviewUrl(null); setMediaType(null);}}
              >
                <X size={16} />
              </Button>
            </div>
          )}

          <Button 
            className="w-full h-14 rounded-3xl text-sm font-black uppercase shadow-xl bg-primary hover:shadow-primary/20 transition-all" 
            disabled={!mediaType || (mediaType !== 'text' && !previewUrl)}
            onClick={handleNext}
          >
            Continue <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Innovation Title</Label>
              <Input 
                placeholder="Name your creation..." 
                className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary/20"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">The Problem</Label>
              <Input 
                placeholder="What challenge are you solving?" 
                className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary/20"
                value={formData.problem}
                onChange={(e) => updateFormData("problem", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Description</Label>
              <Textarea 
                placeholder="Explain the magic behind it..." 
                className="rounded-2xl min-h-[120px] bg-muted/30 border-none focus-visible:ring-primary/20"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest">Who is this for?</Label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_KEYWORDS.map((keyword) => (
                  <Button
                    key={keyword}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleKeyword(keyword)}
                    className={cn(
                      "rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all",
                      formData.targetUsers === keyword 
                        ? "bg-primary text-white border-primary shadow-md" 
                        : "bg-white border-muted-foreground/20 hover:border-primary/50",
                      keyword === "Meme" && formData.targetUsers !== "Meme" && "border-primary text-primary"
                    )}
                  >
                    {keyword}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl hover:shadow-primary/20 transition-all" 
            onClick={handlePublish}
            disabled={isPosting || !formData.title || !formData.description || !formData.targetUsers}
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" /> Publish Innovation
              </>
            )}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
               <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Live in Sphere</h2>
            <p className="text-xs text-muted-foreground font-bold">Your innovation is now live on the home feed!</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button className="h-14 rounded-3xl font-black uppercase shadow-xl" onClick={() => router.push("/")}>
              Go to Home Feed
            </Button>
            <Button variant="ghost" className="font-bold text-xs uppercase" onClick={() => setStep(1)}>
              Create Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

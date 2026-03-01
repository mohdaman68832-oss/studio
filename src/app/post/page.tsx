
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
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
  ImageIcon, 
  Type, 
  Video as VideoIcon, 
  X,
  Send,
  Tags,
  LayoutGrid
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
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
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("Technology");
  
  const isMeme = category.toLowerCase() === "memes" || category.toLowerCase() === "meme";

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(profileRef);

  const [formData, setFormData] = useState({
    title: "",
    problem: "",
    description: "",
  });

  useEffect(() => {
    const type = searchParams.get("mediaType") as any;
    const cat = searchParams.get("category");
    if (type && ["text", "image", "video"].includes(type)) {
      setMediaType(type);
      if (type === "text") {
        setStep(2);
      }
    }
    if (cat) {
      setCategory(cat);
    }
  }, [searchParams]);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const handleNext = () => {
    if (step < 2) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) {
        if (mediaType === 'text' && step === 2) {
            setStep(1);
            setMediaType(null);
        } else {
            setStep((s) => (s - 1) as Step);
        }
    }
  };

  const handlePublish = async () => {
    if (!db || !user) return;
    setIsPosting(true);
    try {
      // 1. Create the post
      await addDoc(collection(db, "ideas"), {
        title: formData.title,
        problem: isMeme ? "Meme content" : (formData.problem || "N/A"),
        description: formData.description,
        category: category,
        userName: user.displayName || profileData?.username || "Innovator",
        userAvatar: profileData?.profilePictureUrl || user.photoURL || "https://picsum.photos/seed/me/100/100",
        authorId: user.uid,
        authorUsername: profileData?.username || "user",
        mediaUrl: mediaType === 'text' ? "" : (previewUrl || ""),
        innovationScore: isMeme ? 100 : 75,
        tags: [
          category.toLowerCase(), 
          mediaType || "text", 
          "sphere",
          ...(category.toLowerCase().includes("meme") ? ["meme"] : []),
          ...(formData.description.toLowerCase().includes("#meme") ? ["meme"] : [])
        ],
        createdAt: serverTimestamp(),
        likes: 0
      });

      // 2. Increment total posts count in user profile
      const userProfileRef = doc(db, "userProfiles", user.uid);
      updateDoc(userProfileRef, {
        totalIdeasPosted: increment(1)
      });

      toast({
        title: "Success!",
        description: isMeme ? "Meme is live!" : "Innovation published!",
      });

      setStep(3);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Posting Failed",
        description: "Something went wrong.",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="max-w-md mx-auto p-6 pb-24 space-y-6 bg-background min-h-screen transition-all duration-300">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
           <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">
                New Innovation
            </h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                {step === 3 ? "Complete" : `Step ${step} of 2`}
            </p>
           </div>
           {step === 2 && (
             <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full text-[10px] font-black uppercase tracking-widest">
               <ChevronLeft className="w-4 h-4 mr-1" /> Back
             </Button>
           )}
        </header>
        <Progress value={progress} className="h-1.5 bg-muted" />
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center block">
                Choose Format
            </Label>
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
                    <span className="text-[10px] font-black uppercase tracking-widest">Image</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[35vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <SheetHeader>
                    <SheetTitle className="text-center text-[10px] font-black uppercase tracking-widest">
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
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                       <Upload />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-10 h-12 font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-xl">
                      Choose Photo
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
                    <VideoIcon className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Video</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[35vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <SheetHeader>
                    <SheetTitle className="text-center text-[10px] font-black uppercase tracking-widest">
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
                    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                       <Upload />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-10 h-12 font-black uppercase text-[10px] tracking-widest bg-secondary text-white shadow-xl">
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
                <span className="text-[10px] font-black uppercase tracking-widest">Text Only</span>
              </Button>
            </div>
          </div>

          {previewUrl && (mediaType === 'image' || mediaType === 'video') && (
            <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border-2 border-primary/20 shadow-2xl animate-in zoom-in-95">
              {mediaType === 'video' ? (
                <video src={previewUrl} className="w-full h-full object-cover" controls />
              ) : (
                <Image 
                  src={previewUrl} 
                  alt="Preview" 
                  fill 
                  className="object-cover" 
                  unoptimized={previewUrl.startsWith('data:') || previewUrl.startsWith('blob:')}
                />
              )}
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-lg"
                onClick={() => {setPreviewUrl(null); setMediaType(null);}}
              >
                <X size={20} />
              </Button>
            </div>
          )}

          <Button 
            className="w-full h-14 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl bg-primary text-white hover:shadow-primary/20 transition-all" 
            disabled={!mediaType || (mediaType !== 'text' && !previewUrl)}
            onClick={handleNext}
          >
            Details <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Title</Label>
              <Input 
                placeholder="Innovation title..." 
                className="rounded-2xl h-14 bg-muted/30 border-none focus-visible:ring-primary/20 text-sm font-bold"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Tags size={14} className="text-primary" /> Category Hub
                </Label>
                <Sheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-[10px] font-black uppercase text-secondary">
                      See All <LayoutGrid size={12} className="ml-1" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-[3rem] h-[60vh] overflow-y-auto no-scrollbar pb-10">
                    <SheetHeader>
                      <SheetTitle className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">
                        Select Innovation Hub
                      </SheetTitle>
                    </SheetHeader>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      {CATEGORY_KEYWORDS.map((kw) => (
                        <Button
                          key={kw}
                          variant={category === kw ? "default" : "outline"}
                          onClick={() => { setCategory(kw); setIsCategorySheetOpen(false); }}
                          className={cn(
                            "rounded-2xl h-14 text-[9px] font-black uppercase tracking-widest",
                            category === kw ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-muted/50"
                          )}
                        >
                          {kw}
                        </Button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex flex-wrap gap-2 p-1">
                {CATEGORY_KEYWORDS.slice(0, 8).map((keyword) => (
                  <Button
                    key={keyword}
                    variant="outline"
                    size="sm"
                    onClick={() => setCategory(keyword)}
                    className={cn(
                      "rounded-full text-[9px] font-black uppercase tracking-widest transition-all h-9 px-4",
                      category === keyword 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : "bg-white border-muted text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {keyword}
                  </Button>
                ))}
              </div>
            </div>

            {!isMeme && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">The Challenge</Label>
                <Input 
                  placeholder="What problem are you solving?" 
                  className="rounded-2xl h-14 bg-muted/30 border-none focus-visible:ring-primary/20 text-sm font-bold"
                  value={formData.problem}
                  onChange={(e) => updateFormData("problem", e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                {isMeme ? "Meme Caption" : "Description"}
              </Label>
              <Textarea 
                placeholder={isMeme ? "Write something funny..." : "Detailed explanation..."} 
                className="rounded-2xl min-h-[140px] bg-muted/30 border-none focus-visible:ring-primary/20 text-sm font-medium"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
              />
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase tracking-widest shadow-xl hover:shadow-primary/20 transition-all" 
            onClick={handlePublish}
            disabled={isPosting || !formData.title || !formData.description}
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" /> Post Innovation
              </>
            )}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">Live in Sphere</h2>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Shared successfully!</p>
          </div>

          <div className="flex flex-col gap-4">
            <Button className="h-14 rounded-3xl font-black uppercase tracking-widest bg-primary text-white shadow-xl" onClick={() => router.push("/")}>
              Back to Feed
            </Button>
            <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest" onClick={() => {
                setStep(1);
                setMediaType(null);
                setPreviewUrl(null);
                setFormData({ title: "", problem: "", description: "" });
            }}>
              Post Another
            </Button>
          </div>
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

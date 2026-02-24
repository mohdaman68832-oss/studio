
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Image as ImageIcon, 
  Type, 
  Video, 
  X,
  Plus
} from "lucide-react";
import { analyzeIdeaOnPost, AIIdeaAnalysisOnPostOutput } from "@/ai/flows/ai-idea-analysis-on-post";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

type Step = 1 | 2 | 3;

export default function PostPage() {
  const [step, setStep] = useState<Step>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIIdeaAnalysisOnPostOutput | null>(null);
  const [mediaType, setMediaType] = useState<"text" | "image" | "video" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem: "",
    solution: "",
    targetUsers: "",
    category: "Technology",
    tags: [] as string[],
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    if (formData.tags.length >= 3) {
      toast({
        title: "Tag Limit Reached",
        description: "You can only add up to 3 tags.",
        variant: "destructive"
      });
      return;
    }
    if (!formData.tags.includes(tagInput.trim())) {
      updateFormData("tags", [...formData.tags, tagInput.trim()]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateFormData("tags", formData.tags.filter(t => t !== tag));
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeIdeaOnPost({
        ...formData,
        mediaDataUri: previewUrl || undefined
      });
      setAnalysisResult(result);
      setStep(3);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Something went wrong while analyzing your idea.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="max-w-md mx-auto p-6 pb-24 space-y-6 bg-background min-h-screen">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
           <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">New Post</h1>
            <p className="text-xs text-muted-foreground font-bold">Step {step} of 3</p>
           </div>
           {step > 1 && (
             <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full text-xs font-bold uppercase">
               <ChevronLeft className="w-4 h-4 mr-1" /> Back
             </Button>
           )}
        </header>
        <Progress value={progress} className="h-1.5 bg-muted" />
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Post Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`h-24 flex-col gap-2 rounded-3xl border-2 transition-all ${mediaType === 'image' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                    onClick={() => handleMediaSelect("image")}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">Image</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[35vh]">
                  <SheetHeader>
                    <SheetTitle className="text-center text-sm font-black uppercase">
                      Upload {mediaType === 'video' ? 'Video' : 'Image'}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept={mediaType === 'video' ? 'video/*' : 'image/*'} 
                      onChange={handleFileChange} 
                    />
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                       <Upload className="text-muted-foreground" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase text-center px-8">
                      Select a {mediaType === 'video' ? 'video file' : 'high-quality image'} to showcase your idea.
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-8 font-bold uppercase text-xs">
                      Choose File
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`h-24 flex-col gap-2 rounded-3xl border-2 transition-all ${mediaType === 'video' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                    onClick={() => handleMediaSelect("video")}
                  >
                    <Video className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">Video</span>
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
                      onChange={handleFileChange} 
                    />
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                       <Upload className="text-muted-foreground" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase text-center px-8">
                      Select a short video to demonstrate your innovation.
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-8 font-bold uppercase text-xs">
                      Choose Video
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button 
                variant="outline" 
                className={`h-24 flex-col gap-2 rounded-3xl border-2 transition-all ${mediaType === 'text' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                onClick={() => handleMediaSelect("text")}
              >
                <Type className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Text Only</span>
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

          <div className="space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Innovation Title</Label>
                <Input 
                  placeholder="The next big thing..." 
                  className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary/20"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Catchy Description</Label>
                <Textarea 
                  placeholder="What makes it special?" 
                  className="rounded-2xl min-h-[100px] bg-muted/30 border-none focus-visible:ring-primary/20"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                />
             </div>
          </div>

          <Button 
            className="w-full h-14 rounded-3xl text-sm font-black uppercase shadow-xl bg-primary hover:shadow-primary/20 transition-all" 
            disabled={!formData.title || !formData.description || (mediaType !== 'text' && !previewUrl)}
            onClick={handleNext}
          >
            Details <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">The Problem</Label>
              <Textarea 
                placeholder="What pain point are you solving?" 
                className="rounded-2xl bg-muted/30 border-none min-h-[80px]"
                value={formData.problem}
                onChange={(e) => updateFormData("problem", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">The Solution</Label>
              <Textarea 
                placeholder="How does your idea work?" 
                className="rounded-2xl bg-muted/30 border-none min-h-[80px]"
                value={formData.solution}
                onChange={(e) => updateFormData("solution", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Target Audience</Label>
              <Input 
                placeholder="Who is this for?" 
                className="rounded-2xl h-12 bg-muted/30 border-none"
                value={formData.targetUsers}
                onChange={(e) => updateFormData("targetUsers", e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest">Tags (Max 3)</Label>
                <span className="text-[10px] font-bold text-muted-foreground">{formData.tags.length}/3</span>
              </div>
              <div className="flex gap-2 bg-muted/30 p-2 rounded-2xl">
                <Input 
                  placeholder="Add a tag..." 
                  className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-8"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={addTag}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} className="rounded-full bg-primary/10 text-primary border-none py-1 px-3 flex items-center gap-1">
                    #{tag}
                    <X size={12} className="cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-3xl bg-secondary text-white font-black uppercase shadow-xl hover:bg-secondary/90 transition-all" 
            onClick={runAnalysis}
            disabled={isAnalyzing || !formData.problem || !formData.solution}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> Analyze with AI
              </>
            )}
          </Button>
        </div>
      )}

      {step === 3 && analysisResult && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
               <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Analysis Complete</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-primary/5 border-none shadow-none rounded-[2rem]">
              <CardContent className="p-4 text-center">
                <span className="text-[9px] uppercase font-black text-muted-foreground block mb-1">Score</span>
                <span className="text-2xl font-black text-primary">{analysisResult.innovationScore}</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-none shadow-none rounded-[2rem]">
              <CardContent className="p-4 text-center">
                <span className="text-[9px] uppercase font-black text-muted-foreground block mb-1">Market</span>
                <span className="text-xs font-black text-primary uppercase">{analysisResult.marketPotential.split(" ")[0]}</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-none shadow-none rounded-[2rem]">
              <CardContent className="p-4 text-center">
                <span className="text-[9px] uppercase font-black text-muted-foreground block mb-1">Uniqueness</span>
                <span className="text-xs font-black text-primary uppercase">{analysisResult.uniquenessLevel.split(" ")[0]}</span>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
             <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Expert AI Insights</Label>
             <div className="bg-muted/30 p-5 rounded-[2.5rem] border border-muted/50">
               <div className="text-xs text-foreground/80 leading-relaxed space-y-3">
                  {analysisResult.improvementSuggestions.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
               </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button className="h-14 rounded-3xl font-black uppercase shadow-xl" onClick={() => window.location.href = "/"}>
              Publish to Sphere
            </Button>
            <Button variant="ghost" className="font-bold text-xs uppercase" onClick={handleBack}>
              Edit Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

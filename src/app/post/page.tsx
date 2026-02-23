
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Upload, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { analyzeIdeaOnPost, AIIdeaAnalysisOnPostOutput } from "@/ai/flows/ai-idea-analysis-on-post";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type Step = 1 | 2 | 3;

export default function PostPage() {
  const [step, setStep] = useState<Step>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIIdeaAnalysisOnPostOutput | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem: "",
    solution: "",
    targetUsers: "",
    category: "Technology",
  });

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      const result = await analyzeIdeaOnPost(formData);
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
    <div className="max-w-md mx-auto p-6 pb-24 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-primary">New Innovation</h1>
        <Progress value={progress} className="h-2" />
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="space-y-2">
            <Label>Idea Title</Label>
            <Input 
              placeholder="Give your idea a catchy name" 
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Brief Description</Label>
            <Textarea 
              placeholder="Explain it in 2 sentences" 
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
            />
          </div>
          <div className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/20">
            <Upload size={32} />
            <span className="text-sm font-medium">Upload Media (Video/Photo)</span>
            <Button variant="outline" size="sm" className="rounded-full">Choose Files</Button>
          </div>
          <Button 
            className="w-full h-12 rounded-2xl mt-4" 
            onClick={handleNext}
            disabled={!formData.title || !formData.description}
          >
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="space-y-2">
            <Label>Problem to Solve</Label>
            <Textarea 
              placeholder="What challenge are you addressing?" 
              value={formData.problem}
              onChange={(e) => updateFormData("problem", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Proposed Solution</Label>
            <Textarea 
              placeholder="How exactly does it work?" 
              value={formData.solution}
              onChange={(e) => updateFormData("solution", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Target Users</Label>
            <Input 
              placeholder="Who is this for?" 
              value={formData.targetUsers}
              onChange={(e) => updateFormData("targetUsers", e.target.value)}
            />
          </div>
          <div className="flex gap-4 mt-4">
            <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={handleBack}>
              <ChevronLeft className="mr-2 w-4 h-4" /> Back
            </Button>
            <Button 
              className="flex-[2] rounded-2xl h-12 bg-secondary hover:bg-secondary/90 text-white" 
              onClick={runAnalysis}
              disabled={isAnalyzing || !formData.problem || !formData.solution}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-4 h-4" /> Analyze Idea
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && analysisResult && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <CheckCircle2 className="mx-auto w-12 h-12 text-green-500" />
            <h2 className="text-xl font-bold">Analysis Complete!</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-primary/5 border-none">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Score</span>
                <span className="text-xl font-black text-primary">{analysisResult.innovationScore}</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-none">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Market</span>
                <span className="text-xs font-bold text-primary">{analysisResult.marketPotential.split(" ")[0]}</span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-none">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Unique</span>
                <span className="text-xs font-bold text-primary">{analysisResult.uniquenessLevel.split(" ")[0]}</span>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-primary font-bold">Expert Feedback</Label>
              <div className="mt-2 text-sm text-muted-foreground space-y-2 bg-muted/30 p-4 rounded-2xl border border-muted">
                {analysisResult.improvementSuggestions.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </div>

          <Button className="w-full h-12 rounded-2xl" onClick={() => window.location.href = "/"}>
            Post to Feed
          </Button>
          <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={handleBack}>
            Edit Details
          </Button>
        </div>
      )}
    </div>
  );
}

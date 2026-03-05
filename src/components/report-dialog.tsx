
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Flag, Loader2 } from "lucide-react";

interface ReportDialogProps {
  targetId: string;
  targetType: "post" | "profile" | "message";
  trigger?: React.ReactNode;
}

const REASONS = [
  "Inappropriate Content",
  "Spam or Misleading",
  "Harassment or Bullying",
  "Hate Speech",
  "Violence or Danger",
  "Other"
];

export function ReportDialog({ targetId, targetType, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [loading, setLoading] = useState(false);
  const { db } = useFirestore() as any; // Hook returns instance
  const { user } = useUser();
  const { toast } = useToast();

  const handleReport = async () => {
    if (!user || !db) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        reporterId: user.uid,
        targetId,
        targetType,
        reason,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast({ title: "Report Sent", description: "Thank you for keeping InnovateSphere safe." });
      setOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to Report", description: "Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 h-8 px-2 hover:text-destructive">
            <Flag size={14} /> <span className="text-[10px] font-black uppercase">Report</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-primary">Report {targetType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase leading-relaxed">
            Why are you reporting this? Your report is anonymous and helps us improve the community.
          </p>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            {REASONS.map((r) => (
              <div key={r} className="flex items-center space-x-3 p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r} className="flex-1 text-sm font-bold cursor-pointer">{r}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button 
            className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase shadow-lg" 
            onClick={handleReport}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

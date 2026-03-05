
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, CheckCircle2, Trash2, AlertTriangle, Eye, ChevronLeft, MessageSquare, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminReportsPage() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const reportsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "reports"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: reports, isLoading } = useCollection(reportsQuery);

  const resolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
      toast({ title: "Resolved", description: "Report marked as safe." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const deleteOffendingContent = async (report: any) => {
    setProcessingId(report.id);
    try {
      let collectionName = "";
      if (report.targetType === "post") collectionName = "posts";
      else if (report.targetType === "profile") collectionName = "userProfiles";
      
      if (collectionName) {
        await deleteDoc(doc(db, collectionName, report.targetId));
        await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
        toast({ title: "Purged", description: `The reported ${report.targetType} has been removed.` });
      } else if (report.targetType === "message") {
        toast({ title: "Note", description: "Messages must be handled manually in Firebase Console for safety." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Content might already be gone." });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background p-6 pb-24 space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Safety Console</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={12} /> Live Moderation
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <Card key={report.id} className="border-2 border-primary/5 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="pb-2 border-b border-primary/5 bg-primary/[0.02]">
                <div className="flex justify-between items-center">
                  <Badge variant={report.status === "pending" ? "destructive" : "secondary"} className="rounded-full text-[8px] font-black uppercase px-3 py-1">
                    {report.status}
                  </Badge>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">
                    {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : "Recent"}
                  </p>
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-primary pt-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-destructive" /> 
                  {report.targetType} Violation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                  <p className="text-[9px] font-black uppercase text-destructive mb-1 tracking-widest">Violation Reason</p>
                  <p className="text-sm font-bold text-foreground leading-tight">"{report.reason}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-xl">
                    <p className="text-[8px] font-black uppercase opacity-40">Offender ID</p>
                    <p className="text-[10px] font-mono font-bold truncate">{report.targetId}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl">
                    <p className="text-[8px] font-black uppercase opacity-40">Reporter ID</p>
                    <p className="text-[10px] font-mono font-bold truncate">{report.reporterId}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {/* Dedicated Isolated View Logic */}
                  {report.targetType === 'post' && (
                    <Link href={`/idea/${report.targetId}`} target="_blank" className="w-full">
                      <Button variant="outline" size="sm" className="w-full rounded-xl h-12 text-[10px] font-black uppercase tracking-widest gap-2 border-2 border-primary/10">
                        <Eye size={16} /> View Isolated Post
                      </Button>
                    </Link>
                  )}
                  
                  {report.targetType === 'profile' && (
                    <Link href={`/profile/id/${report.targetId}`} target="_blank" className="w-full">
                      <Button variant="outline" size="sm" className="w-full rounded-xl h-12 text-[10px] font-black uppercase tracking-widest gap-2 border-2 border-primary/10">
                        <UserCircle size={16} /> Inspect Profile
                      </Button>
                    </Link>
                  )}

                  {report.targetType === 'message' && (
                    <Link href={`/chat/${report.targetId}`} target="_blank" className="w-full">
                      <Button variant="outline" size="sm" className="w-full rounded-xl h-12 text-[10px] font-black uppercase tracking-widest gap-2 border-2 border-primary/10">
                        <MessageSquare size={16} /> Jump to Chat
                      </Button>
                    </Link>
                  )}
                  
                  {report.status === "pending" && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <Button 
                        size="sm" 
                        className="rounded-2xl h-12 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-green-200"
                        onClick={() => resolveReport(report.id)}
                      >
                        <CheckCircle2 size={16} className="mr-1.5" /> Mark Safe
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="rounded-2xl h-12 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-destructive/20"
                        disabled={processingId === report.id}
                        onClick={() => deleteOffendingContent(report)}
                      >
                        {processingId === report.id ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} className="mr-1.5" /> Purge Content</>}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 opacity-20">
            <ShieldAlert size={64} className="mx-auto text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Active Reports</p>
          </div>
        )}
      </div>
    </div>
  );
}

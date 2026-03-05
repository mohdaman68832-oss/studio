
"use client";

import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, CheckCircle2, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  const { data: reports, isLoading } = useCollection(reportsQuery);

  const resolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
      toast({ title: "Resolved", description: "Report marked as resolved." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const deleteReportOnly = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      toast({ title: "Report Deleted", description: "The report record was removed." });
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
      else if (report.targetType === "message") {
        // Messages are sub-collections, tricky to delete from here without parent ID
        // For MVP, we alert that it should be handled in the specific chat
        toast({ title: "Note", description: "Messages must be deleted from the chat directly or Firebase Console." });
        return;
      }

      if (collectionName) {
        await deleteDoc(doc(db, collectionName, report.targetId));
        // Also mark report as resolved
        await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
        toast({ title: "Success", description: `The reported ${report.targetType} has been deleted.` });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Action Failed", description: "Could not delete the target content." });
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
      <header>
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Safety Hub</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Admin Control Center</p>
      </header>

      <div className="space-y-6">
        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <Card key={report.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm border-primary/5">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={report.status === "pending" ? "destructive" : "secondary"} className="rounded-full text-[8px] font-black uppercase tracking-widest px-3 py-1">
                    {report.status}
                  </Badge>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">
                    {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : "New"}
                  </p>
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-primary pt-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-destructive" /> {report.targetType} Reported
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[9px] font-black uppercase text-primary mb-1">Violation Reason</p>
                  <p className="text-xs font-bold leading-relaxed">{report.reason}</p>
                </div>

                <div className="flex flex-col gap-1.5 px-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Target Content ID:</p>
                  <code className="text-[10px] bg-muted p-2 rounded-lg break-all font-mono">{report.targetId}</code>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {report.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 rounded-full h-10 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[9px] tracking-widest shadow-md"
                        onClick={() => resolveReport(report.id)}
                      >
                        <CheckCircle2 size={14} className="mr-1.5" /> Mark Safe
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1 rounded-full h-10 font-black uppercase text-[9px] tracking-widest shadow-md"
                        disabled={processingId === report.id}
                        onClick={() => deleteOffendingContent(report)}
                      >
                        {processingId === report.id ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} className="mr-1.5" /> Delete Content</>}
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full rounded-full h-10 border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-black uppercase text-[9px] tracking-widest"
                    onClick={() => deleteReportOnly(report.id)}
                  >
                    Discard Report Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 opacity-30">
            <ShieldAlert size={48} className="mx-auto text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Safety Sphere Clear</p>
            <p className="text-[9px] font-medium uppercase px-10">No active reports to review.</p>
          </div>
        )}
      </div>

      <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10 text-center">
        <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-2">Safety Protocols</p>
        <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed">
          Manage reports through this dashboard or directly in the Firebase Console Firestore tab.
        </p>
      </div>
    </div>
  );
}

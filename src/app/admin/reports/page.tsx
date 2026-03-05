
"use client";

import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, CheckCircle2, Trash2, AlertTriangle, ExternalLink, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";

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
        toast({ title: "Note", description: "Messages must be handled via Firebase Console for full safety." });
        return;
      }

      if (collectionName) {
        await deleteDoc(doc(db, collectionName, report.targetId));
        await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
        toast({ title: "Content Purged", description: `The reported ${report.targetType} has been removed.` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Permissions or ID mismatch." });
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
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Safety Console</h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert size={12} /> Community Moderation Hub
        </p>
      </header>

      <div className="space-y-6">
        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <Card key={report.id} className="border-2 border-primary/5 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
              <CardHeader className="pb-2 border-b border-primary/5 bg-primary/[0.02]">
                <div className="flex justify-between items-start">
                  <Badge variant={report.status === "pending" ? "destructive" : "secondary"} className="rounded-full text-[8px] font-black uppercase tracking-widest px-3 py-1">
                    {report.status}
                  </Badge>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-50">
                    ID: {report.id.slice(0, 8)}...
                  </p>
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-primary pt-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-destructive animate-pulse" /> 
                  Reported {report.targetType}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                  <p className="text-[9px] font-black uppercase text-destructive mb-1.5 tracking-widest">Violation Reason</p>
                  <p className="text-sm font-bold text-foreground leading-tight">"{report.reason}"</p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1 px-1">
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Target Content Link:</p>
                    <div className="flex items-center gap-2 mt-1">
                      {report.targetType === 'post' ? (
                        <Link href={`/idea/${report.targetId}`} target="_blank" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest gap-2">
                            <Eye size={14} /> Review Post
                          </Button>
                        </Link>
                      ) : report.targetType === 'profile' ? (
                        <code className="text-[10px] bg-muted p-3 rounded-xl break-all font-mono flex-1 border border-border/50">
                          {report.targetId}
                        </code>
                      ) : (
                        <span className="text-[10px] font-bold italic text-muted-foreground">Private Content ID: {report.targetId}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {report.status === "pending" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        size="sm" 
                        className="rounded-2xl h-12 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-green-500/20"
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
                        {processingId === report.id ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} className="mr-1.5" /> Delete</>}
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="w-full rounded-2xl h-10 text-muted-foreground hover:text-destructive font-black uppercase text-[8px] tracking-widest opacity-50 hover:opacity-100"
                    onClick={() => deleteReportOnly(report.id)}
                  >
                    Clear Report History
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 opacity-20">
            <ShieldAlert size={64} className="mx-auto text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sphere Clear</p>
            <p className="text-[9px] font-medium uppercase px-10">No active reports found.</p>
          </div>
        )}
      </div>

      <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10 text-center">
        <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-2">Safety Protocol</p>
        <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed">
          Reports are stored in the 'reports' collection in Firestore. Action taken here is permanent.
        </p>
      </div>
    </div>
  );
}

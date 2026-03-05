
"use client";

import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function AdminReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();

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

  const deleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      toast({ title: "Deleted", description: "Report removed from system." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
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

      <div className="space-y-4">
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
                <CardTitle className="text-sm font-black uppercase tracking-tight text-primary pt-2">
                  {report.targetType} Reported
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[9px] font-black uppercase text-primary mb-1">Reason</p>
                  <p className="text-xs font-bold leading-relaxed">{report.reason}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Target ID: <span className="text-foreground">{report.targetId}</span></p>
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Reporter: <span className="text-foreground">{report.reporterId}</span></p>
                </div>

                <div className="flex gap-2 pt-2">
                  {report.status === "pending" && (
                    <Button 
                      size="sm" 
                      className="flex-1 rounded-full h-10 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[9px] tracking-widest shadow-md"
                      onClick={() => resolveReport(report.id)}
                    >
                      <CheckCircle2 size={14} className="mr-1.5" /> Resolve
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 rounded-full h-10 border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-black uppercase text-[9px] tracking-widest"
                    onClick={() => deleteReport(report.id)}
                  >
                    <Trash2 size={14} className="mr-1.5" /> Delete
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
          As an admin, you are responsible for maintaining the innovation sphere's integrity. Review reports carefully before taking action.
        </p>
      </div>
    </div>
  );
}

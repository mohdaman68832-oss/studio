
"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowBigUp, MoreHorizontal, Share2, Play, MessageCircle, Eye, Flag, Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, setDoc, deleteDoc, increment, collection, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ReportDialog } from "@/components/report-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IdeaCardProps {
  idea: {
    id: string;
    uid: string;
    username: string;
    userAvatar: string;
    title: string;
    description: string;
    problem?: string;
    category: string;
    mediaUrl: string;
    innovationScore: number;
    likes?: number;
    views?: number;
  };
  priority?: boolean;
  isProfileView?: boolean;
}

export function IdeaCard({ idea, priority = false, isProfileView = false }: IdeaCardProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const viewTracked = useRef(false);

  // Author live data
  const authorProfileRef = useMemoFirebase(() => 
    (db && idea.uid) ? doc(db, "userProfiles", idea.uid) : null
  , [db, idea.uid]);
  const { data: authorProfile } = useDoc(authorProfileRef);

  const suggestionsQuery = useMemoFirebase(() => 
    (db && idea.id) ? collection(db, "posts", idea.id, "suggestions") : null
  , [db, idea.id]);
  const { data: suggestions } = useCollection(suggestionsQuery);
  const commentCount = suggestions?.length || 0;

  const liveAvatar = authorProfile?.profilePictureUrl || idea.userAvatar || "";
  const liveUsername = authorProfile?.username || idea.username;

  const userLikeRef = useMemoFirebase(() => 
    (db && user && idea.id) ? doc(db, "posts", idea.id, "likes", user.uid) : null
  , [db, user, idea.id]);
  
  const { data: userLike } = useDoc(userLikeRef);
  const isLiked = !!userLike;

  const ideaDocRef = useMemoFirebase(() => 
    (db && idea.id) ? doc(db, "posts", idea.id) : null
  , [db, idea.id]);
  const { data: liveIdeaData } = useDoc(ideaDocRef);

  const likesCount = liveIdeaData?.likes ?? idea.likes ?? 0;
  const viewCount = liveIdeaData?.views ?? idea.views ?? 0;

  // Strict Unique View Tracking
  useEffect(() => {
    const trackView = async () => {
      if (!db || !idea.id || !user || viewTracked.current) return;

      const viewRecordRef = doc(db, "posts", idea.id, "views", user.uid);
      const postRef = doc(db, "posts", idea.id);

      try {
        const viewSnap = await getDoc(viewRecordRef);
        if (!viewSnap.exists()) {
          viewTracked.current = true; // Set immediately to prevent parallel triggers
          await setDoc(viewRecordRef, { viewedAt: serverTimestamp() });
          await updateDoc(postRef, { views: increment(1) });
        } else {
          viewTracked.current = true; // Already exists, just mark as tracked in session
        }
      } catch (err) {
        console.warn("View tracking silent fail", err);
      }
    };

    trackView();
  }, [db, idea.id, user]);

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db || !user || !idea.id || isProcessing) return;

    setIsProcessing(true);
    const postRef = doc(db, "posts", idea.id);
    const likeDocRef = doc(db, "posts", idea.id, "likes", user.uid);

    if (isLiked) {
      deleteDoc(likeDocRef)
        .then(() => updateDoc(postRef, { likes: increment(-1) }))
        .finally(() => setTimeout(() => setIsProcessing(false), 300));
    } else {
      setDoc(likeDocRef, { userId: user.uid })
        .then(() => updateDoc(postRef, { likes: increment(1) }))
        .finally(() => setTimeout(() => setIsProcessing(false), 300));
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({ title: "Shared!", description: "Link copied to clipboard." });
  };

  const handleDeletePost = async () => {
    if (!db || !idea.id || deleteConfirmText !== "DELETE") return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", idea.id));
      toast({ title: "Post Purged", description: "Your innovation has been removed from the sphere." });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not remove post at this time." });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmText("");
    }
  };

  const isVideo = idea.mediaUrl && (idea.mediaUrl.endsWith('.mp4') || idea.mediaUrl.includes('gtv-videos-bucket'));
  const isTextPost = !idea.mediaUrl || idea.mediaUrl === "";

  if (isProfileView) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-primary/5 p-6 space-y-4 animate-in fade-in duration-500">
        <div className="block group space-y-3">
          <div className="flex justify-between items-start">
            <Link href={`/idea/${idea.id}`} className="flex-1 mr-4">
              <h3 className="text-xl font-black text-primary uppercase tracking-tighter leading-tight hover:underline transition-all">
                {idea.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-full shrink-0">
                <span className="text-[10px] font-black text-muted-foreground">{viewCount} Views</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreHorizontal size={20} className="text-muted-foreground" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-1 border-2">
                   {user?.uid === idea.uid ? (
                     <DropdownMenuItem onClick={() => { setDeleteConfirmText(""); setIsDeleteDialogOpen(true); }} className="text-destructive font-black uppercase text-[10px] gap-2 p-3 rounded-xl cursor-pointer">
                       <Trash2 size={14} /> Delete Post
                     </DropdownMenuItem>
                   ) : (
                     <DropdownMenuItem disabled className="text-[10px] font-black uppercase p-3">Options Limited</DropdownMenuItem>
                   )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!isTextPost && (
            <Link href={`/idea/${idea.id}`} className="block">
              <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden bg-muted shadow-inner">
                {isVideo ? (
                   <div className="w-full h-full flex items-center justify-center bg-black"><Play className="text-white fill-white" size={32} /></div>
                ) : (
                  <Image src={idea.mediaUrl} alt={idea.title} width={800} height={450} className="object-cover transition-transform group-hover:scale-105" />
                )}
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-6">
            <button type="button" onClick={handleToggleLike} className={cn("flex items-center gap-2 group", isProcessing && "opacity-50")}>
              <ArrowBigUp size={28} className={cn("transition-all", isLiked ? "text-secondary fill-current" : "text-foreground/20 group-hover:text-primary")} />
              <span className={cn("text-xs font-black", isLiked ? "text-secondary" : "text-muted-foreground")}>{likesCount}</span>
            </button>
            
            <Link href={`/idea/${idea.id}`} className="flex items-center gap-2 group">
              <MessageCircle size={22} className="text-foreground/20 group-hover:text-primary transition-colors" />
              <span className="text-xs font-black text-muted-foreground">{commentCount}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user?.uid !== idea.uid && (
              <ReportDialog targetId={idea.id} targetType="post" />
            )}
            <button type="button" onClick={handleShare} className="p-2 text-foreground/20 hover:text-primary transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeleteConfirmText("");
        }}>
          <DialogContent className="rounded-[2.5rem] max-w-[90vw] sm:max-w-md border-none shadow-2xl">
            <DialogHeader className="space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2 text-destructive">
                <AlertTriangle size={32} />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-center">Delete Innovation?</DialogTitle>
              <DialogDescription className="text-center font-bold text-muted-foreground uppercase text-[10px] tracking-widest leading-relaxed">
                This action is irreversible. To proceed, please type <span className="text-destructive font-black">DELETE</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="relative h-14 w-full">
                {deleteConfirmText === "DELETE" ? (
                  <Button 
                    variant="destructive" 
                    disabled={isDeleting}
                    onClick={handleDeletePost}
                    className="absolute inset-0 w-full h-full rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-destructive/30 animate-in zoom-in-95 duration-300"
                  >
                    {isDeleting ? <Loader2 className="animate-spin mr-2" /> : "Purge Innovation Now"}
                  </Button>
                ) : (
                  <Input 
                    placeholder="Type DELETE to confirm" 
                    className="absolute inset-0 w-full h-full rounded-2xl bg-muted/30 border-none text-center font-black uppercase placeholder:opacity-30 tracking-widest focus-visible:ring-primary/20"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                )}
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => setIsDeleteDialogOpen(false)} 
                className="w-full rounded-2xl h-12 font-black uppercase text-[9px] tracking-widest text-muted-foreground/60 hover:text-foreground"
              >
                Cancel Action
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 p-5">
      <div className="flex items-center justify-between mb-1">
        <Link href={`/profile/${liveUsername}`} className="flex items-center gap-3 z-10">
          <Avatar className={cn(
            "h-10 w-10 border-2 border-primary/5 transition-all duration-500",
            authorProfile?.isOnline && "shadow-[0_15px_30px_rgba(255,69,0,0.5)] shadow-primary/50 border-primary"
          )}>
            <AvatarImage src={liveAvatar} className="object-cover" />
            <AvatarFallback className="text-[10px] font-black uppercase bg-primary/5 text-primary">
              {liveUsername?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-black text-foreground">@{liveUsername}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreHorizontal size={20} className="text-muted-foreground" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl p-1 border-2">
            {user?.uid === idea.uid ? (
              <DropdownMenuItem onClick={() => { setDeleteConfirmText(""); setIsDeleteDialogOpen(true); }} className="text-destructive font-black uppercase text-[10px] gap-2 p-3 rounded-xl cursor-pointer">
                <Trash2 size={14} /> Delete Post
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <ReportDialog 
                  targetId={idea.id} 
                  targetType="post" 
                  trigger={<button className="w-full text-left px-3 py-2 text-xs font-black uppercase flex items-center gap-2 text-destructive"><Flag size={14} /> Report Post</button>} 
                />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4">
        <Link href={`/idea/${idea.id}`} className="block group">
          <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-none mb-2">{idea.title}</h3>
          {idea.problem && <p className="text-sm text-foreground/80 leading-relaxed font-bold">{idea.problem}</p>}
          
          {!isTextPost && (
            <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden bg-muted mt-3 shadow-sm">
              {isVideo ? (
                 <div className="w-full h-full flex items-center justify-center bg-black"><Play className="text-white fill-white" size={32} /></div>
              ) : (
                <Image src={idea.mediaUrl} alt={idea.title} fill className="object-cover transition-transform group-hover:scale-105" />
              )}
            </div>
          )}
        </Link>
      </div>

      <div className="flex items-center justify-start mt-4 gap-4">
        <button type="button" onClick={handleToggleLike} className={cn("flex items-center gap-2", isProcessing && "opacity-50")}>
          <ArrowBigUp size={32} className={cn("transition-all", isLiked ? "text-secondary fill-current" : "text-foreground/30")} />
          <span className={cn("text-sm font-black", isLiked ? "text-secondary" : "text-foreground/40")}>{likesCount}</span>
        </button>
        <Link href={`/idea/${idea.id}`} className="p-2 flex items-center gap-1.5">
          <MessageCircle size={26} className="text-muted-foreground" />
          <span className="text-[10px] font-black text-muted-foreground mt-1">{commentCount}</span>
        </Link>
        
        <div className="flex items-center gap-1 ml-auto mr-1 bg-muted/20 px-2 py-1 rounded-full">
           <Eye size={14} className="text-muted-foreground/60" />
           <span className="text-[9px] font-black text-muted-foreground/60">{viewCount}</span>
        </div>

        <div className="flex items-center gap-1">
          {user?.uid !== idea.uid && (
            <ReportDialog 
              targetId={idea.id} 
              targetType="post" 
              trigger={<Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:text-destructive"><Flag size={18} /></Button>}
            />
          )}
          <button type="button" onClick={handleShare} className="p-2 text-muted-foreground/40 hover:text-primary"><Share2 size={22} /></button>
        </div>
      </div>

      {/* Global Delete Confirmation Dialog (for Feed View) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setDeleteConfirmText("");
      }}>
        <DialogContent className="rounded-[2.5rem] max-w-[90vw] sm:max-w-md border-none shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2 text-destructive">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-center">Delete Innovation?</DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground uppercase text-[10px] tracking-widest leading-relaxed">
              This action is irreversible. To proceed, please type <span className="text-destructive font-black">DELETE</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="relative h-14 w-full">
              {deleteConfirmText === "DELETE" ? (
                <Button 
                  variant="destructive" 
                  disabled={isDeleting}
                  onClick={handleDeletePost}
                  className="absolute inset-0 w-full h-full rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-destructive/30 animate-in zoom-in-95 duration-300"
                >
                  {isDeleting ? <Loader2 className="animate-spin mr-2" /> : "Purge Innovation Now"}
                </Button>
              ) : (
                <Input 
                  placeholder="Type DELETE to confirm" 
                  className="absolute inset-0 w-full h-full rounded-2xl bg-muted/30 border-none text-center font-black uppercase placeholder:opacity-30 tracking-widest focus-visible:ring-primary/20"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              )}
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteDialogOpen(false)} 
              className="w-full rounded-2xl h-12 font-black uppercase text-[9px] tracking-widest text-muted-foreground/60 hover:text-foreground"
            >
              Cancel Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

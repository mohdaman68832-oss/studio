"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowBigUp, MoreHorizontal, Share2, Play, MessageCircle, Eye, Flag, Trash2, Loader2 } from "lucide-react";
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
          viewTracked.current = true;
          await setDoc(viewRecordRef, { viewedAt: serverTimestamp() });
          await updateDoc(postRef, { views: increment(1) });
        } else {
          viewTracked.current = true;
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
    if (!db || !idea.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", idea.id));
      toast({ title: "Post Purged", description: "Your innovation has been removed from the sphere." });
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not remove post at this time." });
      setIsDeleting(false);
    }
  };

  const isVideo = idea.mediaUrl && (idea.mediaUrl.endsWith('.mp4') || idea.mediaUrl.includes('gtv-videos-bucket'));
  const isTextPost = !idea.mediaUrl || idea.mediaUrl === "";

  const renderHeaderMenu = () => (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 focus-visible:ring-0">
          <MoreHorizontal size={20} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl p-1 border-2 z-[1001]">
        {isProfileView && user?.uid === idea.uid ? (
          <DropdownMenuItem 
            onSelect={handleDeletePost} 
            disabled={isDeleting}
            className="text-destructive font-black uppercase text-[10px] gap-2 p-3 rounded-xl cursor-pointer"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
            {isDeleting ? "Deleting..." : "Delete Post"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <ReportDialog 
              targetId={idea.id} 
              targetType="post" 
              trigger={
                <button className="w-full text-left px-3 py-2 text-xs font-black uppercase flex items-center gap-2 text-destructive">
                  <Flag size={14} /> Report Post
                </button>
              } 
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isProfileView) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-primary/5 p-6 space-y-4 animate-in fade-in duration-500 relative">
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
              {renderHeaderMenu()}
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
            <button type="button" onClick={handleShare} className="p-2 text-foreground/20 hover:text-primary transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 p-5 relative">
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
        {renderHeaderMenu()}
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
          <button type="button" onClick={handleShare} className="p-2 text-muted-foreground/40 hover:text-primary"><Share2 size={22} /></button>
        </div>
      </div>
    </div>
  );
}

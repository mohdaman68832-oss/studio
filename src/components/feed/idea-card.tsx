
"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigUp, MoreHorizontal, Share2, Play, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, deleteDoc, increment, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    description: string;
    problem?: string;
    category: string;
    userName: string;
    userAvatar: string;
    authorUsername?: string;
    authorId?: string;
    mediaUrl: string;
    innovationScore: number;
    tags: string[];
    likes?: number;
  };
  priority?: boolean;
  isMemeView?: boolean;
}

export function IdeaCard({ idea, priority = false, isMemeView = false }: IdeaCardProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Reference to the current user's like for this post
  const userLikeRef = useMemoFirebase(() => 
    (db && user && idea.id) ? doc(db, "ideas", idea.id, "likes", user.uid) : null
  , [db, user, idea.id]);
  
  const { data: userLike } = useDoc(userLikeRef);
  const isLiked = !!userLike;

  // Real-time listener for the main idea doc to get live likes count
  const ideaDocRef = useMemoFirebase(() => 
    (db && idea.id) ? doc(db, "ideas", idea.id) : null
  , [db, idea.id]);
  const { data: liveIdeaData } = useDoc(ideaDocRef);

  // Use live count if available, otherwise fallback to idea props
  const likesCount = liveIdeaData?.likes ?? idea.likes ?? 0;

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db || !user || !idea.id || isProcessing) return;

    setIsProcessing(true);
    const ideaRef = doc(db, "ideas", idea.id);
    const likeDocRef = doc(db, "ideas", idea.id, "likes", user.uid);

    if (isLiked) {
      // Remove Like (Decrement)
      deleteDoc(likeDocRef)
        .then(() => {
          // Update likes count without updating createdAt to prevent jumping
          setDoc(ideaRef, { likes: increment(-1) }, { merge: true });
        })
        .finally(() => {
          setTimeout(() => setIsProcessing(false), 300);
        });
    } else {
      // Add Like (Increment)
      setDoc(likeDocRef, { 
        timestamp: serverTimestamp(),
        userId: user.uid 
      })
        .then(() => {
          // Important: We do NOT update createdAt here.
          // This ensures the post stays in its original chronological position.
          setDoc(ideaRef, { 
            likes: increment(1),
            title: idea.title || "Untitled",
            authorId: idea.authorId || 'system',
            // DO NOT set createdAt: serverTimestamp() here as it causes the post to jump to top
          }, { merge: true });
        })
        .finally(() => {
          setTimeout(() => setIsProcessing(false), 300);
        });
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: "Shared!",
      description: "Link copied to clipboard.",
    });
  };

  // Safe username handling to avoid .toLowerCase() on undefined
  const userHandle = idea.authorUsername || (idea.userName || 'user').toLowerCase().replace(/\s/g, '');
  const isVideo = idea.mediaUrl && (idea.mediaUrl.includes('blob:') || idea.mediaUrl.endsWith('.mp4') || idea.mediaUrl.endsWith('.webm') || idea.mediaUrl.includes('gtv-videos-bucket') || idea.mediaUrl.startsWith('data:video'));
  const isTextPost = !idea.mediaUrl || idea.mediaUrl.includes('textpost') || idea.mediaUrl === "";

  const CardHeader = (
    <div className="flex items-center justify-between mb-1">
      <Link href={`/profile/${userHandle}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
          <AvatarImage src={idea.userAvatar} />
          <AvatarFallback>{(idea.userName || 'U')[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground tracking-tight">
            @{userHandle}
          </span>
        </div>
      </Link>
      <button type="button" className="text-muted-foreground p-2 hover:bg-muted rounded-full transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <MoreHorizontal size={20} />
      </button>
    </div>
  );

  const MediaContent = (
    <div className="block relative aspect-square w-full mx-auto overflow-hidden bg-muted rounded-[1.5rem] mt-2 group cursor-zoom-in">
      {isVideo ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video src={idea.mediaUrl} className="w-full h-full object-cover opacity-80" muted />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
              <Play className="text-white fill-white" size={32} />
            </div>
          </div>
        </div>
      ) : (
        <Image
          src={idea.mediaUrl || "https://picsum.photos/seed/placeholder/800/800"}
          alt={idea.title}
          fill
          priority={priority}
          className="object-cover transition-transform group-hover:scale-105 duration-700"
          unoptimized={!!idea.mediaUrl && (idea.mediaUrl.startsWith('data:') || idea.mediaUrl.startsWith('blob:'))}
        />
      )}
    </div>
  );

  const LikeButton = (
    <button 
      type="button"
      onClick={handleToggleLike}
      className={cn(
        "flex items-center gap-2 transition-all duration-300 transform active:scale-125 group/like outline-none",
        isProcessing && "active-glow"
      )}
    >
      <ArrowBigUp 
        size={32} 
        className={cn(
          "transition-all duration-300",
          isLiked ? "text-secondary fill-current drop-shadow-[0_0_8px_rgba(255,69,0,0.4)]" : "text-foreground/30"
        )} 
      />
      <span className={cn(
        "text-sm font-black transition-colors leading-none",
        isLiked ? "text-secondary" : "text-foreground/40"
      )}>
        {likesCount}
      </span>
    </button>
  );

  if (isMemeView) {
    return (
      <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 p-5">
        {CardHeader}
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="mt-4">
              {MediaContent}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-screen h-screen w-full p-0 bg-black/95 border-none shadow-none flex items-center justify-center z-[200]">
            <DialogHeader className="sr-only">
              <DialogTitle>{idea.title || "Meme Viewer"}</DialogTitle>
            </DialogHeader>
            <DialogClose className="absolute top-6 right-6 z-[210] bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-all">
              <X size={32} />
            </DialogClose>
            <div className="relative w-full h-full p-4 flex items-center justify-center">
              {isVideo ? (
                <video src={idea.mediaUrl} controls autoPlay className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={idea.mediaUrl || "https://picsum.photos/seed/placeholder/800/800"}
                    alt={idea.title}
                    fill
                    className="object-contain"
                    unoptimized={!!idea.mediaUrl && (idea.mediaUrl.startsWith('data:') || idea.mediaUrl.startsWith('blob:'))}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-start mt-4 gap-4">
            {LikeButton}
            <Link href={`/idea/${idea.id}`} className="text-foreground hover:text-primary transition-all p-2" onClick={(e) => e.stopPropagation()}>
              <MessageCircle size={26} />
            </Link>
            <button 
              type="button"
              onClick={handleShare}
              className="text-foreground hover:text-primary transition-all p-2"
            >
              <Share2 size={24} />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 transition-all">
      <div className="px-5 pt-5 pb-3 space-y-3">
        {CardHeader}

        <Link href={`/idea/${idea.id}`} className="block space-y-2" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-none">
            {idea.title}
          </h3>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">The Challenge</p>
            <p className="text-sm text-foreground/80 leading-relaxed font-bold">
              {idea.problem || "Solving urban challenges with innovation."}
            </p>
          </div>
        </Link>
      </div>

      {!isTextPost && (
        <Link href={`/idea/${idea.id}`} className="block" onClick={(e) => e.stopPropagation()}>
          {MediaContent}
        </Link>
      )}

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          {LikeButton}
          <Link href={`/idea/${idea.id}`} className="text-foreground hover:text-primary transition-colors p-2" onClick={(e) => e.stopPropagation()}>
            <MessageCircle size={24} />
          </Link>
          <button type="button" onClick={handleShare} className="text-foreground hover:text-primary transition-colors p-2">
            <Share2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}


"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigUp, MoreHorizontal, Lightbulb, Share2, Play, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { doc, setDoc, deleteDoc, increment } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    description: string;
    problem?: string;
    category: string;
    userName: string;
    userAvatar: string;
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user has already liked this post
  const userLikeRef = useMemoFirebase(() => 
    (db && user && idea.id) ? doc(db, "ideas", idea.id, "likes", user.uid) : null
  , [db, user, idea.id]);
  
  const { data: userLike } = useDoc(userLikeRef);
  const isLiked = !!userLike;

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db || !user || !idea.id || isProcessing) return;

    setIsProcessing(true);
    const ideaRef = doc(db, "ideas", idea.id);
    const likeDocRef = doc(db, "ideas", idea.id, "likes", user.uid);

    if (isLiked) {
      // UNDO LIKE (Toggle Off)
      deleteDoc(likeDocRef)
        .then(() => {
          setDoc(ideaRef, { 
            likes: increment(-1) 
          }, { merge: true })
          .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: ideaRef.path,
              operation: 'update',
              requestResourceData: { likes: 'decrement' },
            }));
          });
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: likeDocRef.path,
            operation: 'delete',
          }));
        })
        .finally(() => {
          setTimeout(() => setIsProcessing(false), 300);
        });
    } else {
      // ADD LIKE (Toggle On)
      setDoc(likeDocRef, { 
        timestamp: new Date().toISOString(),
        userId: user.uid 
      })
        .then(() => {
          setDoc(ideaRef, { 
            likes: increment(1) 
          }, { merge: true })
          .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: ideaRef.path,
              operation: 'update',
              requestResourceData: { likes: 'increment' },
            }));
          });
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: likeDocRef.path,
            operation: 'create',
            requestResourceData: { userId: user.uid },
          }));
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

  const userHandle = idea.userName.toLowerCase().replace(/\s/g, '');
  const isVideo = idea.mediaUrl && (idea.mediaUrl.includes('blob:') || idea.mediaUrl.endsWith('.mp4') || idea.mediaUrl.endsWith('.webm') || idea.mediaUrl.includes('gtv-videos-bucket'));
  const isTextPost = !idea.mediaUrl || idea.mediaUrl.includes('textpost') || idea.mediaUrl === "";

  const CardHeader = (
    <div className="flex items-center justify-between mb-1">
      <Link href={`/profile/${userHandle}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
          <AvatarImage src={idea.userAvatar} />
          <AvatarFallback>{idea.userName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground tracking-tight">
            @{userHandle}
          </span>
        </div>
      </Link>
      <button className="text-muted-foreground p-2 hover:bg-muted rounded-full transition-colors">
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
        />
      )}
    </div>
  );

  if (isMemeView) {
    return (
      <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 transition-all hover:shadow-2xl hover:border-primary/20 p-5">
        {CardHeader}
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="mt-4">
              {MediaContent}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-screen h-screen w-full p-0 bg-black/95 border-none shadow-none flex items-center justify-center z-[200]">
            <DialogHeader className="sr-only">
              <DialogTitle>{idea.title || "Meme Preview"}</DialogTitle>
            </DialogHeader>
            <DialogClose className="absolute top-6 right-6 z-[210] bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-all">
              <X size={32} />
              <span className="sr-only">Close Zoom</span>
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
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-start mt-4 gap-6">
            <Link href={`/idea/${idea.id}`} className="text-foreground hover:text-primary transition-all p-2 flex items-center gap-2">
              <MessageCircle size={28} />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Comment</span>
            </Link>
            <button 
              onClick={handleShare}
              className="text-foreground hover:text-primary transition-all p-2 flex items-center gap-2"
              aria-label="Share"
            >
              <Share2 size={26} />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Share</span>
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 transition-all hover:shadow-2xl hover:border-primary/20">
      <div className="px-5 pt-5 pb-3 space-y-3">
        {CardHeader}

        <Link href={`/idea/${idea.id}`} className="block space-y-2 cursor-pointer">
          <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-none">
            {idea.title}
          </h3>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">The Challenge</p>
            <p className="text-sm text-foreground/80 leading-relaxed font-bold">
              {idea.problem || "Solving common urban challenges with innovation."}
            </p>
          </div>

          {isTextPost && (
            <div className="mt-2 pt-2 border-t border-muted/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Detailed Brief</p>
              <p className="text-sm text-foreground/70 leading-relaxed font-medium line-clamp-3">
                {idea.description}
              </p>
            </div>
          )}
        </Link>
      </div>

      {!isTextPost && (
        <Link href={`/idea/${idea.id}`} className="block">
          {MediaContent}
        </Link>
      )}

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleLike}
            className={cn(
              "flex items-center gap-2 transition-all duration-300 transform active:scale-125",
              isProcessing && "active-glow"
            )}
          >
            <ArrowBigUp 
              size={36} 
              className={cn(
                "transition-all duration-300",
                isLiked ? "text-secondary fill-current drop-shadow-[0_0_8px_rgba(255,69,0,0.4)]" : "text-foreground/30"
              )} 
            />
            <div className="flex flex-col items-start">
              <span className={cn(
                "text-sm font-black transition-colors leading-none",
                isLiked ? "text-secondary" : "text-foreground/40"
              )}>
                {idea.likes || 0}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Upvotes</span>
            </div>
          </button>
          <Link href={`/idea/${idea.id}`} className="text-foreground hover:text-primary transition-colors p-2">
            <MessageCircle size={24} />
          </Link>
          <button 
            onClick={handleShare}
            className="text-foreground hover:text-primary transition-colors p-2"
            aria-label="Share"
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

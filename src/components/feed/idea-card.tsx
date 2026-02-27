
"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigUp, MoreHorizontal, Share2, Play, MessageCircle, Maximize2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, deleteDoc, increment } from "firebase/firestore";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
  const [isProcessing, setIsProcessing] = useState(false);

  const userLikeRef = useMemoFirebase(() => 
    (db && user && idea.id) ? doc(db, "ideas", idea.id, "likes", user.uid) : null
  , [db, user, idea.id]);
  
  const { data: userLike } = useDoc(userLikeRef);
  const isLiked = !!userLike;

  const ideaDocRef = useMemoFirebase(() => 
    (db && idea.id) ? doc(db, "ideas", idea.id) : null
  , [db, idea.id]);
  const { data: liveIdeaData } = useDoc(ideaDocRef);

  const likesCount = liveIdeaData?.likes ?? idea.likes ?? 0;

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db || !user || !idea.id || isProcessing) return;

    setIsProcessing(true);
    const ideaRef = doc(db, "ideas", idea.id);
    const likeDocRef = doc(db, "ideas", idea.id, "likes", user.uid);

    if (isLiked) {
      deleteDoc(likeDocRef)
        .then(() => {
          setDoc(ideaRef, { likes: increment(-1) }, { merge: true });
        })
        .finally(() => {
          setTimeout(() => setIsProcessing(false), 300);
        });
    } else {
      setDoc(likeDocRef, { 
        userId: user.uid 
      })
        .then(() => {
          setDoc(ideaRef, { 
            likes: increment(1)
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
    toast({ title: "Shared!", description: "Link copied to clipboard." });
  };

  const userHandle = idea.authorUsername || (idea.userName || 'user').toLowerCase().replace(/\s/g, '');
  const isVideo = idea.mediaUrl && (idea.mediaUrl.endsWith('.mp4') || idea.mediaUrl.includes('gtv-videos-bucket'));
  const isTextPost = !idea.mediaUrl || idea.mediaUrl === "";

  const CardHeader = (
    <div className="flex items-center justify-between mb-1">
      <Link href={`/profile/${userHandle}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
          <AvatarImage src={idea.userAvatar} />
          <AvatarFallback>{(idea.userName || 'U')[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground tracking-tight">@{userHandle}</span>
        </div>
      </Link>
      <MoreHorizontal size={20} className="text-muted-foreground" />
    </div>
  );

  const LikeButton = (
    <button 
      type="button"
      onClick={handleToggleLike}
      className={cn(
        "flex items-center gap-2 transition-all duration-300 transform active:scale-125 outline-none",
        isProcessing && "opacity-50"
      )}
    >
      <ArrowBigUp 
        size={32} 
        className={cn(
          "transition-all duration-300",
          isLiked ? "text-secondary fill-current drop-shadow-[0_0_8px_rgba(255,69,0,0.4)]" : "text-foreground/30"
        )} 
      />
      <span className={cn("text-sm font-black", isLiked ? "text-secondary" : "text-foreground/40")}>
        {likesCount}
      </span>
    </button>
  );

  return (
    <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 p-5">
      {CardHeader}
      <div className="mt-4">
        <Link href={`/idea/${idea.id}`} className="block">
          <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-none mb-2">{idea.title}</h3>
          <p className="text-sm text-foreground/80 leading-relaxed font-bold">{idea.problem || "Solving challenges."}</p>
        </Link>
        
        {!isTextPost && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden bg-muted mt-3 cursor-zoom-in group">
                {isVideo ? (
                   <div className="w-full h-full flex items-center justify-center bg-black">
                     <Play className="text-white fill-white" size={32} />
                   </div>
                ) : (
                  <Image src={idea.mediaUrl} alt={idea.title} fill className="object-cover transition-transform group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="text-white" size={24} />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] h-[80vh] p-0 overflow-hidden border-none bg-black/90 rounded-[2rem] flex items-center justify-center" onOpenAutoFocus={(e) => e.preventDefault()}>
               <div className="relative w-full h-full p-4 flex items-center justify-center">
                  {isVideo ? (
                    <video src={idea.mediaUrl} controls className="max-w-full max-h-full rounded-xl" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center overflow-auto no-scrollbar">
                      <img src={idea.mediaUrl} alt={idea.title} className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
               </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="flex items-center justify-start mt-4 gap-4">
        {LikeButton}
        <Link href={`/idea/${idea.id}`} className="p-2"><MessageCircle size={26} /></Link>
        <button type="button" onClick={handleShare} className="p-2"><Share2 size={24} /></button>
      </div>
    </div>
  );
}

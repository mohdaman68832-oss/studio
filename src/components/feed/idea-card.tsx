
"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigUp, MoreHorizontal, Share2, Play, MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, deleteDoc, increment } from "firebase/firestore";

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
}

export function IdeaCard({ idea, priority = false }: IdeaCardProps) {
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

  return (
    <div className="bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 p-5">
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

      <div className="mt-4">
        {/* Click image/title to go to conversation (Detail Page) */}
        <Link href={`/idea/${idea.id}`} className="block group">
          <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-none mb-2">{idea.title}</h3>
          <p className="text-sm text-foreground/80 leading-relaxed font-bold">{idea.problem || "Solving challenges."}</p>
          
          {!isTextPost && (
            <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden bg-muted mt-3 shadow-sm">
              {isVideo ? (
                 <div className="w-full h-full flex items-center justify-center bg-black">
                   <Play className="text-white fill-white" size={32} />
                 </div>
              ) : (
                <Image src={idea.mediaUrl} alt={idea.title} fill className="object-cover transition-transform group-hover:scale-105" />
              )}
            </div>
          )}
        </Link>
      </div>

      <div className="flex items-center justify-start mt-4 gap-4">
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
        <Link href={`/idea/${idea.id}`} className="p-2"><MessageCircle size={26} /></Link>
        <button type="button" onClick={handleShare} className="p-2"><Share2 size={24} /></button>
      </div>
    </div>
  );
}

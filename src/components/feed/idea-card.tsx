"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigUp, MoreHorizontal, Lightbulb, Share2, Play } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
    likes: number;
  };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const { toast } = useToast();

  const userHandle = idea.userName.toLowerCase().replace(/\s/g, '');

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    toast({
      title: "Shared!",
      description: "Idea link has been copied to clipboard.",
    });
  };

  const displayLikes = idea.likes + (isLiked ? 1 : 0);
  const isVideo = idea.mediaUrl.includes('blob:') || idea.mediaUrl.endsWith('.mp4') || idea.mediaUrl.endsWith('.webm');

  return (
    <div className="mb-8 bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 transition-all hover:shadow-2xl hover:border-primary/20">
      <div className="px-5 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between mb-1">
           <Link href={`/profile/${userHandle}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarImage src={idea.userAvatar} />
                <AvatarFallback>{idea.userName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-black text-foreground tracking-tight">
                  {idea.userName.toLowerCase().replace(/\s/g, '')}
                </span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">
                  {idea.category} <span className="opacity-30">•</span> Score: {idea.innovationScore}
                </span>
              </div>
           </Link>
           <button className="text-muted-foreground p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-none">
            {idea.title}
          </h3>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">The Challenge</p>
            <p className="text-sm text-foreground/80 leading-relaxed font-bold">
              {idea.problem || "Solving common urban challenges with innovation."}
            </p>
          </div>

          {showDescription && (
            <div className="mt-3 pt-3 border-t border-muted animate-in fade-in slide-in-from-top-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Full Brief</p>
              <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                {idea.description}
              </p>
            </div>
          )}

          <button 
            onClick={() => setShowDescription(!showDescription)}
            className="text-[11px] font-black text-secondary hover:text-secondary/80 mt-1 uppercase tracking-tighter"
          >
            {showDescription ? "See less" : "See more details"}
          </button>
        </div>
      </div>

      <Link href={`/idea/${idea.id}`} className="block relative aspect-square w-full mx-auto overflow-hidden bg-muted">
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
            src={idea.mediaUrl}
            alt={idea.title}
            fill
            className="object-cover transition-transform hover:scale-105 duration-500"
          />
        )}
        <div className="absolute top-4 left-4">
          <Badge className="bg-primary/90 text-white border-none backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
            <Lightbulb size={12} className="fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Join Discussion</span>
          </Badge>
        </div>
      </Link>

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-5">
          <button 
            onClick={handleLikeToggle} 
            className={cn("transition-transform group", isLiked && "active-glow")}
            aria-label="Upvote"
          >
            <ArrowBigUp 
              size={36} 
              className={cn(
                "transition-all duration-300",
                isLiked ? "text-secondary fill-current drop-shadow-[0_0_8px_rgba(255,69,0,0.4)]" : "text-foreground group-hover:text-secondary/50"
              )} 
            />
          </button>
          <button 
            onClick={handleShare}
            className="text-foreground hover:text-primary transition-colors p-2"
            aria-label="Share"
          >
            <Share2 size={24} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 bg-muted/30 py-1.5 px-3 rounded-full border border-border/50">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-background shadow-sm">
                         <AvatarImage src={`https://picsum.photos/seed/${i + 25}/50/50`} />
                    </Avatar>
                ))}
            </div>
            <span className="text-[11px] font-black uppercase tracking-tighter text-foreground/70">
              {displayLikes >= 1000 ? `${(displayLikes / 1000).toFixed(1)}k` : displayLikes} Supporters
            </span>
        </div>
      </div>

      <div className="px-5 pb-6">
          <div className="flex flex-wrap gap-2">
            {idea.tags.map(tag => (
              <span key={tag} className="text-[11px] font-black text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md">
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
      </div>
    </div>
  );
}
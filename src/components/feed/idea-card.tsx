
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
} from "@/components/ui/dialog";

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
  priority?: boolean;
  isMemeView?: boolean;
}

export function IdeaCard({ idea, priority = false, isMemeView = false }: IdeaCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  const userHandle = idea.userName.toLowerCase().replace(/\s/g, '');

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: "Shared!",
      description: "Idea link has been copied to clipboard.",
    });
  };

  const displayLikes = idea.likes + (isLiked ? 1 : 0);
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
      {!isMemeView && (
        <div className="absolute top-4 left-4">
          <Badge className="bg-primary/90 text-white border-none backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
            <Lightbulb size={12} className="fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Join Discussion</span>
          </Badge>
        </div>
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
          <DialogContent className="max-w-[95vw] w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center">
            <div className="relative w-full h-[80vh]">
              {isVideo ? (
                <video src={idea.mediaUrl} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <Image
                  src={idea.mediaUrl || "https://picsum.photos/seed/placeholder/800/800"}
                  alt={idea.title}
                  fill
                  className="object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLikeToggle} 
              className={cn("transition-transform group", isLiked && "active-glow")}
              aria-label="Upvote"
            >
              <ArrowBigUp 
                size={38} 
                className={cn(
                  "transition-all duration-300",
                  isLiked ? "text-secondary fill-current drop-shadow-[0_0_8px_rgba(255,69,0,0.4)]" : "text-foreground group-hover:text-secondary/50"
                )} 
              />
            </button>
            <Link href={`/idea/${idea.id}`} className="text-foreground hover:text-primary transition-colors p-2">
              <MessageCircle size={26} />
            </Link>
            <button 
              onClick={handleShare}
              className="text-foreground hover:text-primary transition-colors p-2"
              aria-label="Share"
            >
              <Share2 size={24} />
            </button>
          </div>
          
          <div className="bg-muted/30 py-1.5 px-3 rounded-full border border-border/50">
              <span className="text-[11px] font-black uppercase tracking-tighter text-foreground/70">
                {displayLikes >= 1000 ? `${(displayLikes / 1000).toFixed(1)}k` : displayLikes} upvotes
              </span>
          </div>
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
              <p className="text-[10px] font-black text-secondary mt-3 uppercase tracking-widest bg-secondary/5 inline-block px-3 py-1 rounded-full">Click to discuss & collaborate</p>
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
              {displayLikes >= 1000 ? `${(displayLikes / 1000).toFixed(1)}k` : displayLikes}
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

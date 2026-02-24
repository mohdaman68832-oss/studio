"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
}

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    description: string;
    category: string;
    userName: string;
    userAvatar: string;
    mediaUrl: string;
    innovationScore: number;
    tags: string[];
    likes: number;
    comments: number;
    commentsList?: Comment[];
  };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="mb-8 bg-background">
      {/* Main Image Frame */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] shadow-xl">
        {/* Header Overlay Inside Image */}
        <div className="absolute top-0 left-0 right-0 z-10 p-5 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={idea.userAvatar} />
                <AvatarFallback>{idea.userName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white drop-shadow-md">
                  {idea.userName.toLowerCase().replace(/\s/g, '')}
                </span>
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center border border-white/20">
                   <svg viewBox="0 0 24 24" className="w-2 h-2 text-white fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
              </div>
              <span className="text-[10px] text-white/90 drop-shadow-md flex items-center gap-1 font-medium">
                {idea.category} • Innovation: {idea.innovationScore}
              </span>
            </div>
          </div>
          <button className="text-white drop-shadow-md p-1 hover:bg-white/20 rounded-full transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <Image
          src={idea.mediaUrl}
          alt={idea.title}
          fill
          className="object-cover"
        />

        {/* Floating Reactions on Image (Bottom Left) */}
        <div className="absolute bottom-6 left-6 flex -space-x-2 items-center">
            {[1, 2].map((i) => (
                <div key={i} className="relative group cursor-pointer">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-lg transition-transform hover:scale-110">
                        <AvatarImage src={`https://picsum.photos/seed/${i + 15}/100/100`} />
                    </Avatar>
                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white">
                        <Heart size={6} className="text-white fill-current" />
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Action Bar Below Image */}
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-5">
          <button onClick={() => setIsLiked(!isLiked)} className="transition-transform active:scale-125">
            <Heart size={26} className={cn(isLiked ? "text-red-500 fill-current" : "text-foreground")} />
          </button>
        </div>
        
        {/* "Liked by" Section */}
        <div className="flex items-center gap-2 bg-muted/30 py-1 px-2 rounded-full border border-muted">
            <div className="flex -space-x-1.5">
                {[1,2,3].map(i => (
                    <Avatar key={i} className="h-5 w-5 border border-white">
                         <AvatarImage src={`https://picsum.photos/seed/${i + 25}/50/50`} />
                    </Avatar>
                ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">
              {((idea.likes + (isLiked ? 1 : 0)) / 1000).toFixed(1)}k Liked
            </span>
        </div>
      </div>

      {/* Text Content */}
      <div className="px-3 space-y-3">
        <div className="space-y-2">
            <h3 className="text-sm font-black text-primary uppercase tracking-tight">{idea.title}</h3>
            <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-bold mr-2">{idea.userName.toLowerCase().replace(/\s/g, '')}</span>
                {idea.description}
            </p>
            {/* Tags Section Re-added */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {idea.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold text-primary/70">
                  #{tag.toLowerCase()}
                </span>
              ))}
            </div>
        </div>

        {/* Comments Section (Always Visible) */}
        {idea.commentsList && idea.commentsList.length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Collaborators & Feed</span>
               <Separator className="flex-1 opacity-30" />
            </div>
            <div className="space-y-4">
              {idea.commentsList.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start">
                  <Avatar className="h-6 w-6 border-2 border-muted shrink-0 shadow-sm">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[11px] leading-snug text-foreground/80">
                        <span className="font-black text-foreground mr-1">{comment.userName.toLowerCase().replace(/\s/g, '')}</span>
                        {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

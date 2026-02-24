"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigUp, MoreHorizontal, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(idea.commentsList || []);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userName: "you",
      userAvatar: "https://picsum.photos/seed/me/100/100",
      text: commentText,
    };

    setLocalComments([newComment, ...localComments]);
    setCommentText("");
  };

  const visibleComments = showAllComments ? localComments : localComments.slice(0, 2);

  return (
    <div className="mb-8 bg-background">
      {/* Header Info Above Image */}
      <div className="px-3 pb-3 space-y-2">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-muted">
                <AvatarImage src={idea.userAvatar} />
                <AvatarFallback>{idea.userName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  {idea.userName.toLowerCase().replace(/\s/g, '')}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {idea.category} • Innovation: {idea.innovationScore}
                </span>
              </div>
           </div>
           <button className="text-muted-foreground p-1 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className={cn(
            "text-sm font-black text-primary uppercase tracking-tight",
            !isExpanded && "truncate"
          )}>
            {idea.title}
          </h3>
          <div className={cn(
            "text-sm text-foreground/90 leading-relaxed",
            !isExpanded && "line-clamp-2"
          )}>
            {idea.description}
          </div>
          {!isExpanded && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-[10px] font-bold text-primary hover:underline mt-1 uppercase tracking-tighter"
            >
              See more
            </button>
          )}
          {isExpanded && (
             <button 
              onClick={() => setIsExpanded(false)}
              className="text-[10px] font-bold text-muted-foreground hover:underline mt-1 uppercase tracking-tighter"
            >
              Show less
            </button>
          )}
        </div>
      </div>

      {/* Main Image Frame */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] shadow-xl">
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
                </div>
            ))}
        </div>
      </div>

      {/* Action Bar Below Image */}
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-5">
          <button onClick={() => setIsLiked(!isLiked)} className="transition-transform active:scale-125">
            <ArrowBigUp size={32} className={cn(isLiked ? "text-primary fill-current" : "text-foreground")} />
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
              {((idea.likes + (isLiked ? 1 : 0)) / 1000).toFixed(1)}k Upvoted
            </span>
        </div>
      </div>

      {/* Tags Section (Moved below actions to keep it clean) */}
      <div className="px-3 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map(tag => (
              <span key={tag} className="text-[10px] font-bold text-primary/70">
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
      </div>

      {/* Comment Input Box */}
      <div className="px-3 space-y-4">
        <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-2xl border border-muted/30">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://picsum.photos/seed/me/100/100" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center">
            <Input 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 shadow-none text-xs h-8 px-0"
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            {commentText && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleAddComment}>
                <Send size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {localComments.length > 0 && (
          <div className="pt-2 space-y-3 pb-4">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Collaborators & Feed</span>
               <Separator className="flex-1 opacity-30" />
            </div>
            <div className="space-y-4">
              {visibleComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-300">
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

            {localComments.length > 2 && (
              <button 
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors mt-2 uppercase tracking-tighter"
              >
                {showAllComments ? "Show Less" : `View ${localComments.length - 2} More Comments...`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

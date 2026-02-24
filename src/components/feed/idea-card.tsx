"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigUp, MoreHorizontal, Send, Lightbulb } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
  };

  const visibleComments = showAllComments ? localComments : localComments.slice(0, 2);
  const displayLikes = idea.likes + (isLiked ? 1 : 0);

  return (
    <div className="mb-8 bg-card rounded-[2.5rem] idea-card-shadow overflow-hidden border border-border/50 transition-all hover:shadow-2xl hover:border-primary/20">
      {/* Header Info Above Image */}
      <div className="px-5 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between mb-1">
           <div className="flex items-center gap-3">
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
           </div>
           <button className="text-muted-foreground p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className={cn(
            "text-lg font-black text-primary uppercase tracking-tighter leading-none",
            !isExpanded && "truncate"
          )}>
            {idea.title}
          </h3>
          <div className={cn(
            "text-sm text-foreground/80 leading-relaxed font-medium",
            !isExpanded && "line-clamp-2"
          )}>
            {idea.description}
          </div>
          {!isExpanded && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-[11px] font-black text-secondary hover:text-secondary/80 mt-1 uppercase tracking-tighter"
            >
              Read full brief
            </button>
          )}
          {isExpanded && (
             <button 
              onClick={() => setIsExpanded(false)}
              className="text-[11px] font-black text-muted-foreground hover:text-foreground mt-1 uppercase tracking-tighter"
            >
              Collapse
            </button>
          )}
        </div>
      </div>

      {/* Main Image Frame */}
      <div className="relative aspect-square w-full mx-auto overflow-hidden">
        <Image
          src={idea.mediaUrl}
          alt={idea.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-primary/90 text-white border-none backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
            <Lightbulb size={12} className="fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Seeking Suggestions</span>
          </Badge>
        </div>
      </div>

      {/* Action Bar Below Image */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-5">
          <button 
            onClick={handleLikeToggle} 
            className="transition-transform active:scale-150 group"
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
        </div>
        
        {/* "Liked by" Section */}
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

      {/* Tags Section */}
      <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-2">
            {idea.tags.map(tag => (
              <span key={tag} className="text-[11px] font-black text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md">
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
      </div>

      {/* Comment Input Box */}
      <div className="px-5 space-y-4 pb-6">
        <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-2xl border border-border/50">
          <Avatar className="h-8 w-8 shadow-sm">
            <AvatarImage src="https://picsum.photos/seed/me/100/100" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center">
            <Input 
              placeholder="Give a suggestion or feedback..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 shadow-none text-xs h-8 px-0 placeholder:text-muted-foreground/60 font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            {commentText && (
              <button 
                className="h-8 w-8 text-secondary flex items-center justify-center hover:bg-secondary/10 rounded-full transition-all" 
                onClick={handleAddComment}
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {localComments.length > 0 && (
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Suggestion Hub</span>
               <Separator className="flex-1 opacity-50" />
            </div>
            <div className="space-y-4">
              {visibleComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-300">
                  <Avatar className="h-7 w-7 border border-muted/50 shrink-0 shadow-sm">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/20 p-3 rounded-2xl rounded-tl-none border border-border/30">
                    <p className="text-[12px] leading-relaxed text-foreground/90">
                        <span className="font-black text-primary mr-1.5">{comment.userName.toLowerCase().replace(/\s/g, '')}</span>
                        {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {localComments.length > 2 && (
              <button 
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-[11px] font-black text-secondary hover:underline transition-all mt-2 uppercase tracking-tighter"
              >
                {showAllComments ? "Show less" : `View ${localComments.length - 2} more suggestions...`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

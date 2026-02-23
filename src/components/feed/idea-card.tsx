
"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Bookmark, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  return (
    <Card className="mb-6 overflow-hidden border-none idea-card-shadow rounded-2xl group">
      <CardHeader className="p-4 flex-row items-center space-y-0 gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={idea.userAvatar} />
          <AvatarFallback>{idea.userName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{idea.userName}</span>
          <span className="text-xs text-muted-foreground">{idea.category}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20">
          <Lightbulb className="w-3 h-3 text-secondary fill-secondary" />
          <span className="text-xs font-bold text-secondary">{idea.innovationScore}</span>
        </div>
      </CardHeader>

      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={idea.mediaUrl}
          alt={idea.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-lg leading-tight line-clamp-1 text-primary">{idea.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {idea.description}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-muted text-[10px] font-medium border-none rounded-md px-2 py-0">
              #{tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={cn("flex items-center gap-1.5 transition-colors", isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500")}
          >
            <Heart size={20} className={cn(isLiked && "fill-current")} />
            <span className="text-xs font-medium">{idea.likes + (isLiked ? 1 : 0)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle size={20} />
            <span className="text-xs font-medium">{idea.comments}</span>
          </button>
          <button className="text-muted-foreground hover:text-primary transition-colors">
            <Share2 size={20} />
          </button>
        </div>
        <button 
          onClick={() => setIsSaved(!isSaved)}
          className={cn("transition-colors", isSaved ? "text-primary" : "text-muted-foreground hover:text-primary")}
        >
          <Bookmark size={20} className={cn(isSaved && "fill-current")} />
        </button>
      </CardFooter>
    </Card>
  );
}

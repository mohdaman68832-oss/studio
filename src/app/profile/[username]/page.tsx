
"use client";

import { use } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Grid, Bookmark, Heart, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();

  // Mock mapping handles to full names for display
  const userMap: Record<string, { name: string, bio: string, role: string, avatar: string }> = {
    alexrivera: {
      name: "Alex Rivera",
      bio: "Hardware enthusiast & IoT developer. Passionate about sustainable energy and smart grid technology.",
      role: "Smart Grid Architect",
      avatar: "https://picsum.photos/seed/user1/200/200"
    },
    sarahchen: {
      name: "Sarah Chen",
      bio: "Focusing on AI solutions for accessibility and health. Designing the future of wearable tech.",
      role: "AI & Health Researcher",
      avatar: "https://picsum.photos/seed/user2/200/200"
    },
    marcusvane: {
      name: "Marcus Vane",
      bio: "Urban innovator looking to solve city pollution. Creating compact tech for a cleaner world.",
      role: "Product Designer @ UrbanTech",
      avatar: "https://picsum.photos/seed/user3/200/200"
    }
  };

  const userData = userMap[username] || {
    name: username.charAt(0).toUpperCase() + username.slice(1),
    bio: "Passionate innovator sharing ideas with the sphere.",
    role: "Sphere Explorer",
    avatar: `https://picsum.photos/seed/${username}/200/200`
  };

  const USER_IDEAS = [
    `https://picsum.photos/seed/${username}1/300/300`,
    `https://picsum.photos/seed/${username}2/300/300`,
    `https://picsum.photos/seed/${username}3/300/300`,
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-6 pb-24">
      <div className="px-6 flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-lg font-black text-primary uppercase tracking-tighter">Profile</h1>
        <Button variant="ghost" size="icon" className="rounded-full opacity-0 pointer-events-none">
          <ChevronLeft size={24} />
        </Button>
      </div>

      <div className="px-6 flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src={userData.avatar} />
            <AvatarFallback>{userData.name[0]}</AvatarFallback>
          </Avatar>
        </div>
        <h2 className="text-xl font-black text-foreground">{userData.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">{userData.role}</p>
        <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed mb-6">
          {userData.bio}
        </p>
        
        <div className="flex gap-3 w-full px-6 mb-6">
          <Button className="flex-1 rounded-2xl font-bold uppercase text-xs h-11 bg-primary shadow-lg shadow-primary/20">
            Follow
          </Button>
          <Button variant="outline" className="rounded-2xl font-bold uppercase text-xs h-11 border-primary/20 text-primary">
            <MessageSquare size={16} className="mr-2" /> Message
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-8 w-full border-t pt-6">
          <div className="text-center">
            <p className="text-lg font-black text-primary">{Math.floor(Math.random() * 20) + 1}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Ideas</p>
          </div>
          <div className="text-center border-x">
            <p className="text-lg font-black text-primary">{Math.floor(Math.random() * 500) + 100}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Views</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-primary">{Math.floor(Math.random() * 1000) + 50}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Likes</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ideas" className="w-full">
        <TabsList className="w-full bg-transparent border-b rounded-none px-6 mb-1">
          <TabsTrigger value="ideas" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Grid size={18} />
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Bookmark size={18} />
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Heart size={18} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ideas" className="px-1">
          <div className="grid grid-cols-3 gap-1">
            {USER_IDEAS.map((src, i) => (
              <div key={i} className="aspect-square relative overflow-hidden group">
                <Image 
                  src={src} 
                  alt="User idea" 
                  fill 
                  className="object-cover transition-transform group-hover:scale-110" 
                />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="saved" className="px-6 py-12 text-center text-muted-foreground">
          <p className="text-sm font-medium opacity-50 uppercase tracking-tighter">Private Collection</p>
        </TabsContent>
        <TabsContent value="liked" className="px-6 py-12 text-center text-muted-foreground">
          <p className="text-sm font-medium opacity-50 uppercase tracking-tighter">Private Collection</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

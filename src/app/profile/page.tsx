
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {Settings, Edit3, Grid, Bookmark, Heart, LogOut} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const MY_IDEAS = [
    "https://picsum.photos/seed/idea1/300/300",
    "https://picsum.photos/seed/idea2/300/300",
    "https://picsum.photos/seed/idea3/300/300",
    "https://picsum.photos/seed/idea4/300/300",
    "https://picsum.photos/seed/idea5/300/300",
    "https://picsum.photos/seed/idea6/300/300",
  ];

  if (isUserLoading) {
    return <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">Loading Profile...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-6 pb-24">
      <div className="px-6 flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Profile</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSignOut}><LogOut size={20}/></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><Settings size={20}/></Button>
        </div>
      </div>

      <div className="px-6 flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src={user.photoURL || "https://picsum.photos/seed/me/200/200"} />
            <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
        </div>
        <h2 className="text-xl font-black text-foreground">{user.displayName || "Innovator"}</h2>
        <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
        <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed mb-6">
          Building the future of decentralized energy systems. Open to hardware collaborations.
        </p>
        
        <div className="grid grid-cols-3 gap-8 w-full">
          <div className="text-center">
            <p className="text-lg font-black text-primary">12</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Ideas</p>
          </div>
          <div className="text-center border-x">
            <p className="text-lg font-black text-primary">4.2k</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Views</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-primary">856</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Likes</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-ideas" className="w-full">
        <TabsList className="w-full bg-transparent border-b rounded-none px-6 mb-1">
          <TabsTrigger value="my-ideas" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Grid size={18} />
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Bookmark size={18} />
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Heart size={18} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-ideas" className="px-1">
          <div className="grid grid-cols-3 gap-1">
            {MY_IDEAS.map((src, i) => (
              <div key={i} className="aspect-square relative overflow-hidden group">
                <Image 
                  src={src} 
                  alt="My idea" 
                  fill 
                  className="object-cover transition-transform group-hover:scale-110" 
                />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="saved" className="px-6 py-12 text-center text-muted-foreground">
          <Bookmark size={48} className="mx-auto mb-4 opacity-10" />
          <p className="text-sm font-medium">You haven't saved any ideas yet.</p>
        </TabsContent>
        <TabsContent value="liked" className="px-6 py-12 text-center text-muted-foreground">
          <Heart size={48} className="mx-auto mb-4 opacity-10" />
          <p className="text-sm font-medium">Your liked ideas will appear here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

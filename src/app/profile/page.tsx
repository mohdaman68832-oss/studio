
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Grid, Bookmark, Heart, LogOut, User, Bell, Shield, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
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
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xs font-black uppercase tracking-widest text-primary">Loading Profile...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pt-6 pb-24">
      <div className="px-6 flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Profile</h1>
        
        {/* Settings Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 transition-colors">
              <Settings size={22} className="text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] p-6 bg-background">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-center text-sm font-black uppercase tracking-widest">Settings</SheetTitle>
            </SheetHeader>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4 hover:bg-primary/5">
                <User size={18} className="text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest">Edit Profile</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4 hover:bg-primary/5">
                <Bell size={18} className="text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest">Notifications</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4 hover:bg-primary/5">
                <Shield size={18} className="text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest">Privacy & Security</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4 hover:bg-primary/5 border-b border-border/50 mb-4 pb-4">
                <HelpCircle size={18} className="text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest">Help Center</span>
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="w-full justify-start h-14 rounded-2xl gap-4 text-secondary hover:bg-secondary/5 hover:text-secondary"
              >
                <LogOut size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="px-6 flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} />
            <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
        </div>
        <h2 className="text-xl font-black text-foreground">{user.displayName || "Innovator"}</h2>
        <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
        <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed mb-6">
          Building the future of decentralized energy systems. Open to hardware collaborations.
        </p>
        
        <div className="grid grid-cols-3 gap-8 w-full border-t border-b py-6 my-2">
          <div className="text-center">
            <p className="text-lg font-black text-primary">12</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ideas</p>
          </div>
          <div className="text-center border-x">
            <p className="text-lg font-black text-primary">4.2k</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Views</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-primary">856</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Likes</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-ideas" className="w-full">
        <TabsList className="w-full bg-transparent border-b rounded-none px-6 mb-1 h-12">
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
        <TabsContent value="my-ideas" className="px-1 mt-2">
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
        <TabsContent value="saved" className="px-6 py-16 text-center text-muted-foreground">
          <Bookmark size={48} className="mx-auto mb-4 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-widest">You haven't saved any ideas yet.</p>
        </TabsContent>
        <TabsContent value="liked" className="px-6 py-16 text-center text-muted-foreground">
          <Heart size={48} className="mx-auto mb-4 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-widest">Your liked ideas will appear here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

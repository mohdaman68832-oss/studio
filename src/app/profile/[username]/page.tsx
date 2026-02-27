
"use client";

import { use, useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Grid, Bookmark, Heart, MessageSquare, Loader2, UserPlus, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface CustomColors {
  header?: string;
  userInfo?: string;
  bioCard?: string;
  statsSection?: string;
  tabsList?: string;
  tabsContent?: string;
  background?: string;
}

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return 'inherit';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? '#1A1A1A' : '#FFFFFF';
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);

  // Query to find user profile by username
  const userQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "userProfiles"), where("username", "==", username.toLowerCase()), limit(1));
  }, [db, username]);

  const { data: userProfiles, isLoading } = useCollection(userQuery);
  const profileData = userProfiles?.[0];

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-background flex flex-col items-center justify-center p-12 text-center">
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs mb-4">Innovator Not Found</p>
        <Button onClick={() => router.push("/")} className="rounded-full">Return to Sphere</Button>
      </div>
    );
  }

  const colors: CustomColors = profileData.customColors || {};
  const stickers: Sticker[] = profileData.stickers || [];

  return (
    <div 
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: colors.background || "var(--background)" }}
    >
      {/* HEADER BAR */}
      <div 
        className="px-6 flex justify-between items-center relative z-20 py-4 transition-colors duration-300"
        style={{ backgroundColor: colors.header }}
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft size={24} style={{ color: getContrastColor(colors.header) }} />
        </Button>
        <h1 className="text-lg font-black uppercase tracking-tighter" style={{ color: getContrastColor(colors.header) }}>
          @{profileData.username}
        </h1>
        <div className="w-10" />
      </div>

      {/* USER INFO AREA */}
      <div 
        className="transition-colors duration-300 pb-8 relative z-10"
        style={{ backgroundColor: colors.userInfo }}
      >
        <div className="relative h-48 w-full bg-muted overflow-hidden">
          <Image 
            src={profileData.bannerUrl || `https://picsum.photos/seed/banner${profileData.id}/800/400`} 
            alt="banner" 
            fill 
            className="object-cover" 
            unoptimized={!!profileData.bannerUrl && profileData.bannerUrl.startsWith('data:')}
          />
        </div>

        <div className="px-6 -mt-16 flex flex-col items-center relative z-10">
          <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-lg">
            <AvatarImage src={profileData.profilePictureUrl} />
            <AvatarFallback>{profileData.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center mt-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(colors.userInfo) }}>
              {profileData.username}
            </h2>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60" style={{ color: getContrastColor(colors.userInfo) }}>
              Sphere Member
            </p>
          </div>
          
          <div className="flex gap-3 w-full mt-6">
            <Button 
              className={cn(
                "flex-1 rounded-2xl font-black uppercase text-[10px] h-11 shadow-lg transition-all",
                isFollowing ? "bg-muted text-foreground" : "bg-primary text-white shadow-primary/20"
              )}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? (
                <><UserCheck size={14} className="mr-2" /> Following</>
              ) : (
                <><UserPlus size={14} className="mr-2" /> Follow</>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 rounded-2xl font-black uppercase text-[10px] h-11 border-primary/20 text-primary bg-white/80"
              onClick={() => router.push(`/chat/${profileData.id}`)}
            >
              <MessageSquare size={14} className="mr-2" /> Message
            </Button>
          </div>

          {/* BIO CARD */}
          <div 
            className="p-6 rounded-[2.5rem] border w-full mt-6 transition-colors duration-300 shadow-sm"
            style={{ backgroundColor: colors.bioCard || "#FFFFFF" }}
          >
            <p className="text-center text-xs leading-relaxed font-medium italic break-words overflow-hidden" style={{ color: getContrastColor(colors.bioCard) }}>
              {profileData.bio || "Crafting new ideas daily in the sphere."}
            </p>
          </div>
        </div>
      </div>

      {/* STATS SECTION */}
      <div 
        className="px-6 mb-6 relative z-10 transition-colors duration-300"
        style={{ backgroundColor: colors.statsSection }}
      >
        <div 
          className="grid grid-cols-3 gap-8 w-full py-6 px-4 rounded-[2rem] border transition-colors shadow-sm"
          style={{ backgroundColor: colors.statsSection || "#FFFFFF" }}
        >
          <div className="text-center">
            <p className="text-xl font-black" style={{ color: getContrastColor(colors.statsSection) }}>{profileData.totalIdeasPosted || 0}</p>
            <p className="text-[10px] uppercase font-black opacity-50" style={{ color: getContrastColor(colors.statsSection) }}>Ideas</p>
          </div>
          <div className="text-center border-x border-border/50">
            <p className="text-xl font-black" style={{ color: getContrastColor(colors.statsSection) }}>{(profileData.totalViewsReceived || 0).toLocaleString()}</p>
            <p className="text-[10px] uppercase font-black opacity-50" style={{ color: getContrastColor(colors.statsSection) }}>Views</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black" style={{ color: getContrastColor(colors.statsSection) }}>{(profileData.totalIdeasSaved || 0).toLocaleString()}</p>
            <p className="text-[10px] uppercase font-black opacity-50" style={{ color: getContrastColor(colors.statsSection) }}>Saves</p>
          </div>
        </div>
      </div>

      {/* TABS AND CONTENT */}
      <Tabs defaultValue="ideas" className="w-full relative z-10">
        <div 
          className="transition-colors duration-300 border-b"
          style={{ backgroundColor: colors.tabsList }}
        >
          <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-14">
            <TabsTrigger value="ideas" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent" style={{ color: getContrastColor(colors.tabsList) }}>
              <Grid size={22} />
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent" style={{ color: getContrastColor(colors.tabsList) }}>
              <Bookmark size={22} />
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent" style={{ color: getContrastColor(colors.tabsList) }}>
              <Heart size={22} />
            </TabsTrigger>
          </TabsList>
        </div>

        <div 
          className="min-h-[300px] transition-colors duration-300 pb-20"
          style={{ backgroundColor: colors.tabsContent }}
        >
          <TabsContent value="ideas" className="px-1 mt-0">
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square relative overflow-hidden group">
                  <Image src={`https://picsum.photos/seed/idea${profileData.id}${i}/400/400`} alt="idea" fill className="object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="saved" className="flex items-center justify-center py-20 opacity-30">
            <Bookmark size={40} style={{ color: getContrastColor(colors.tabsContent) }} />
          </TabsContent>
          <TabsContent value="liked" className="flex items-center justify-center py-20 opacity-30">
            <Heart size={40} style={{ color: getContrastColor(colors.tabsContent) }} />
          </TabsContent>
        </div>
      </Tabs>

      {/* STICKERS LAYER */}
      <div className="absolute inset-0 pointer-events-none z-[160]">
        {stickers.map((sticker) => (
          <div 
            key={sticker.id}
            className="absolute"
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`,
            }}
          >
            <div className="relative w-24 h-24">
              <Image 
                src={sticker.url} 
                alt="sticker" 
                fill 
                className="object-contain" 
                unoptimized={sticker.url.startsWith('data:')}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

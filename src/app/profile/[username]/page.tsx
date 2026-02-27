
"use client";

import { use, useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, Loader2, UserPlus, UserCheck, Image as LucideImage, Video, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? '#1A1A1A' : '#FFFFFF';
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const userQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "userProfiles"), where("username", "==", username.toLowerCase()), limit(1));
  }, [db, username]);

  const { data: userProfiles, isLoading } = useCollection(userQuery);
  const profileData = userProfiles?.[0];

  const followRef = useMemoFirebase(() => {
    if (!db || !currentUser || !profileData) return null;
    return doc(db, "follows", `${currentUser.uid}_${profileData.id}`);
  }, [db, currentUser, profileData]);

  const { data: followDoc, isLoading: followLoading } = useDoc(followRef);
  const isFollowing = !!followDoc;

  const handleFollowToggle = async () => {
    if (!db || !currentUser || !profileData) return;
    const docId = `${currentUser.uid}_${profileData.id}`;
    const ref = doc(db, "follows", docId);
    if (isFollowing) {
      await deleteDoc(ref);
      toast({ title: "Unfollowed", description: `You no longer follow @${profileData.username}` });
    } else {
      await setDoc(ref, { followerId: currentUser.uid, followedId: profileData.id, createdAt: serverTimestamp() });
      toast({ title: "Following", description: `You are now following @${profileData.username}` });
    }
  };

  if (isLoading) return <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profileData) return <div className="max-w-md mx-auto min-h-screen bg-background flex flex-col items-center justify-center p-12 text-center"><p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mb-4">Innovator Not Found</p><Button onClick={() => router.push("/")} className="rounded-full shadow-lg font-black uppercase text-[10px] px-8">Return Home</Button></div>;

  const colors: CustomColors = profileData.customColors || {};
  const stickers: Sticker[] = profileData.stickers || [];

  return (
    <div className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden flex flex-col m-0 p-0" style={{ backgroundColor: colors.background || "var(--background)" }}>
      {/* Background Seamless Layer - z-0 */}
      <div className="flex flex-col m-0 p-0 relative z-0">
         <div className="h-16 w-full" style={{ backgroundColor: colors.header }} />
         <div className="h-96 w-full" style={{ backgroundColor: colors.userInfo }} />
         <div className="h-32 w-full" style={{ backgroundColor: colors.statsSection }} />
         <div className="flex-1 w-full" style={{ backgroundColor: colors.tabsContent }} />
      </div>

      {/* Stickers Layer - Between Background and Content - z-10 */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className="absolute" 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`,
              zIndex: 11
            }}
          >
            <div className="relative w-24 h-24">
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      {/* UI Content Layer - Above Everything - z-20 */}
      <div className="absolute inset-0 flex flex-col m-0 p-0 z-20 pointer-events-none">
        <div className="px-6 flex justify-between items-center py-5 pointer-events-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ChevronLeft size={24} style={{ color: getContrastColor(colors.header) }} /></Button>
          <h1 className="text-lg font-black uppercase tracking-tighter" style={{ color: getContrastColor(colors.header) }}>@{profileData.username}</h1>
          <div className="w-10" />
        </div>

        <div className="relative">
          <div className="relative h-56 w-full bg-muted overflow-hidden">
            <Image src={profileData.bannerUrl || `https://picsum.photos/seed/banner${profileData.id}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${profileData.bannerOffset || 50}%` }} unoptimized={true} />
          </div>
          <div className="px-6 -mt-20 flex flex-col items-center pb-10">
            <Avatar className="h-36 w-36 border-4 border-white bg-white shadow-2xl pointer-events-auto"><AvatarImage src={profileData.profilePictureUrl} className="object-cover" /><AvatarFallback className="text-3xl font-black uppercase">{profileData.username?.[0]}</AvatarFallback></Avatar>
            <div className="text-center mt-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(colors.userInfo) }}>{profileData.username}</h2>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50" style={{ color: getContrastColor(colors.userInfo) }}>Sphere Innovator</p>
            </div>
            <div className="flex gap-3 w-full mt-8 pointer-events-auto">
              <Button className={cn("flex-1 rounded-2xl font-black uppercase text-[10px] h-12 shadow-xl", isFollowing ? "bg-muted text-foreground" : "bg-primary text-white")} onClick={handleFollowToggle} disabled={followLoading || profileData.id === currentUser?.uid}>
                {isFollowing ? <><UserCheck size={16} className="mr-2" /> Following</> : <><UserPlus size={16} className="mr-2" /> Follow</>}
              </Button>
              <Button variant="outline" className="flex-1 rounded-2xl font-black uppercase text-[10px] h-12 border-primary/20 text-primary bg-white shadow-lg" onClick={() => router.push(`/chat/${profileData.id}`)}>
                <MessageSquare size={16} className="mr-2" /> Message
              </Button>
            </div>
            <div className="p-8 rounded-[3rem] border w-full mt-8 shadow-xl pointer-events-auto" style={{ backgroundColor: colors.bioCard || "#FFFFFF" }}>
              <p className="text-center text-[13px] leading-relaxed font-bold italic" style={{ color: getContrastColor(colors.bioCard) }}>
                {profileData.bio || "Innovating the future, one idea at a time."}
              </p>
            </div>
          </div>
        </div>

        <div className="py-12 px-10">
          <div className="grid grid-cols-3 gap-8 w-full">
            <div className="text-center">
              <p className="text-2xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{profileData.totalIdeasPosted || 0}</p>
              <p className="text-[9px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(colors.statsSection) }}>Ideas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{(profileData.totalViewsReceived || 0).toLocaleString()}</p>
              <p className="text-[9px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(colors.statsSection) }}>Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{(profileData.totalIdeasSaved || 0).toLocaleString()}</p>
              <p className="text-[9px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(colors.statsSection) }}>Saves</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="photo" className="w-full pointer-events-auto">
          <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-16">
            <TabsTrigger value="photo" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <LucideImage size={24} style={{ color: getContrastColor(colors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Video size={24} style={{ color: getContrastColor(colors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Type size={24} style={{ color: getContrastColor(colors.tabsList) }} />
            </TabsTrigger>
          </TabsList>
          <div className="min-h-[400px] pb-32">
            <TabsContent value="photo" className="mt-0 py-20 text-center">
              <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(colors.tabsContent) }}>No Photo Innovations</p>
            </TabsContent>
            <TabsContent value="video" className="mt-0 py-20 text-center">
              <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(colors.tabsContent) }}>No Video Innovations</p>
            </TabsContent>
            <TabsContent value="text" className="mt-0 py-20 text-center">
              <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(colors.tabsContent) }}>No Text-Based Ideas</p>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

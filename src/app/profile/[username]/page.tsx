"use client";

import { use, useState, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, Loader2, UserPlus, UserCheck, Image as LucideImage, Video, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection as firestoreCollection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { IdeaCard } from "@/components/feed/idea-card";

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
  textOutline?: string;
}

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return 'inherit';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? 'hsl(var(--primary))' : '#FFFFFF';
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const stickerContainerRef = useRef<HTMLDivElement>(null);

  const userQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(firestoreCollection(db, "userProfiles"), where("username", "==", username.toLowerCase()), limit(1));
  }, [db, username]);

  const { data: userProfiles, isLoading } = useCollection(userQuery);
  const profileData = userProfiles?.[0];

  const followRef = useMemoFirebase(() => {
    if (!db || !currentUser || !profileData) return null;
    return doc(db, "follows", `${currentUser.uid}_${profileData.id}`);
  }, [db, currentUser, profileData]);

  const { data: followDoc, isLoading: followLoading } = useDoc(followRef);
  const isFollowing = !!followDoc;

  // Fetch Followers (Circle) and Following (Circling) for this user
  const followingQuery = useMemoFirebase(() => (db && profileData ? query(firestoreCollection(db, "follows"), where("followerId", "==", profileData.id)) : null), [db, profileData]);
  const followersQuery = useMemoFirebase(() => (db && profileData ? query(firestoreCollection(db, "follows"), where("followedId", "==", profileData.id)) : null), [db, profileData]);
  
  const { data: followingData } = useCollection(followingQuery);
  const { data: followersData } = useCollection(followersQuery);

  // Fetch User Posts
  const userPostsQuery = useMemoFirebase(() => {
    if (!db || !profileData) return null;
    return query(firestoreCollection(db, "ideas"), where("authorId", "==", profileData.id), orderBy("createdAt", "desc"));
  }, [db, profileData]);

  const { data: userPosts, isLoading: postsLoading } = useCollection(userPostsQuery);

  const categorizedPosts = useMemo(() => {
    if (!userPosts) return { photos: [], videos: [], text: [] };
    
    return {
      photos: userPosts.filter(p => p.mediaUrl && !p.mediaUrl.includes('.mp4') && !p.mediaUrl.includes('gtv-videos-bucket')),
      videos: userPosts.filter(p => p.mediaUrl && (p.mediaUrl.includes('.mp4') || p.mediaUrl.includes('gtv-videos-bucket'))),
      text: userPosts.filter(p => !p.mediaUrl || p.mediaUrl === "")
    };
  }, [userPosts]);

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
  const outlineColor = colors.textOutline || "transparent";
  const textShadowStyle = outlineColor !== "transparent" 
    ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`
    : "none";

  return (
    <div 
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden flex flex-col no-scrollbar" 
      style={{ backgroundColor: colors.background || "var(--background)" }}
    >
      <div className="relative w-full shrink-0">
        <div className="h-16 w-full relative z-[70]" style={{ backgroundColor: colors.header }} />
        
        <header className="absolute top-0 left-0 right-0 z-[80] px-6 flex justify-between items-center py-5">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft size={24} style={{ color: getContrastColor(colors.header) }} />
          </Button>
          <h1 className="text-lg font-black uppercase tracking-tighter" style={{ color: getContrastColor(colors.header) }}>@{profileData.username}</h1>
          <div className="w-10" />
        </header>

        <div className="relative w-full" ref={stickerContainerRef}>
          <div className="relative h-52 w-full overflow-hidden z-[10]">
            <Image src={profileData.bannerUrl || `https://picsum.photos/seed/banner${profileData.id}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${profileData.bannerOffset || 50}%` }} unoptimized />
          </div>

          <div className="relative px-6 -mt-16 flex flex-col items-center z-[50]">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-2xl">
              <AvatarImage src={profileData.profilePictureUrl} className="object-cover" />
              <AvatarFallback className="text-2xl font-black uppercase">{profileData.username?.[0]}</AvatarFallback>
            </Avatar>
          </div>

          <div className="absolute inset-0 pointer-events-none z-[100]">
            {stickers.map((sticker) => (
              <div 
                key={sticker.id} 
                className="absolute pointer-events-none select-none" 
                style={{ 
                  left: `${sticker.x}%`, 
                  top: `${sticker.y}%`, 
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, 
                }}
              >
                <div className="relative w-24 h-24">
                  <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: colors.userInfo || "transparent" }} className="w-full relative -mt-1 z-[40]">
        <div className="px-6 flex flex-col items-center pb-8">
          <div className="text-center mt-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(colors.userInfo), textShadow: textShadowStyle }}>{profileData.name || profileData.username}</h2>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50" style={{ color: getContrastColor(colors.userInfo), textShadow: textShadowStyle }}>Sphere Innovator</p>
          </div>
          
          <div className="flex gap-3 w-full mt-6 px-4">
            <Button className={cn("flex-1 rounded-2xl font-black uppercase text-[10px] h-11 shadow-xl", isFollowing ? "bg-muted text-foreground" : "bg-primary text-white")} onClick={handleFollowToggle} disabled={followLoading || profileData.id === currentUser?.uid}>
              {isFollowing ? <><UserCheck size={16} className="mr-2" /> Following</> : <><UserPlus size={16} className="mr-2" /> Follow</>}
            </Button>
            <Button variant="outline" className="flex-1 rounded-2xl font-black uppercase text-[10px] h-11 border-primary/20 text-primary bg-white shadow-lg" onClick={() => router.push(`/chat/${profileData.id}`)}>
              <MessageSquare size={16} className="mr-2" /> Message
            </Button>
          </div>

          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-xl" style={{ backgroundColor: colors.bioCard || "#FFFFFF" }}>
            <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(colors.bioCard) }}>
              {profileData.bio || "Innovating the future, one idea at a time."}
            </p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: colors.statsSection || "transparent" }} className="w-full py-8 px-10 relative z-[40]">
        <div className="grid grid-cols-3 gap-6 w-full">
          <div className="text-center">
            <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{profileData.totalIdeasPosted || 0}</p>
            <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(colors.statsSection) }}>Post</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{followersData?.length || 0}</p>
            <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(colors.statsSection) }}>Circle</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{followingData?.length || 0}</p>
            <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(colors.statsSection) }}>Circling</p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: colors.tabsContent || "transparent" }} className="w-full flex-1 relative z-[40]">
        <Tabs defaultValue="photo" className="w-full">
          <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-14" style={{ backgroundColor: colors.tabsList }}>
            <TabsTrigger value="photo" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <LucideImage size={20} style={{ color: getContrastColor(colors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Video size={20} style={{ color: getContrastColor(colors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Type size={20} style={{ color: getContrastColor(colors.tabsList) }} />
            </TabsTrigger>
          </TabsList>
          
          <div className="p-4 space-y-6">
            <TabsContent value="photo" className="space-y-6">
              {categorizedPosts.photos.length > 0 ? (
                categorizedPosts.photos.map(p => <IdeaCard key={p.id} idea={p as any} />)
              ) : (
                <div className="py-16 text-center opacity-20">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(colors.tabsContent) }}>No Photo Innovations</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="video" className="space-y-6">
              {categorizedPosts.videos.length > 0 ? (
                categorizedPosts.videos.map(p => <IdeaCard key={p.id} idea={p as any} />)
              ) : (
                <div className="py-16 text-center opacity-20">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(colors.tabsContent) }}>No Video Innovations</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="text" className="space-y-6">
              {categorizedPosts.text.length > 0 ? (
                categorizedPosts.text.map(p => <IdeaCard key={p.id} idea={p as any} />)
              ) : (
                <div className="py-16 text-center opacity-20">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(colors.tabsContent) }}>No Text-Based Ideas</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

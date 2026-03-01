"use client";

import { use, useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, Loader2, UserPlus, UserCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection as fsCollection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
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
  background?: string;
}

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return 'hsl(var(--primary))';
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

  const userQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(fsCollection(db, "userProfiles"), where("username", "==", username.toLowerCase()), limit(1));
  }, [db, username]);

  const { data: userProfiles, isLoading } = useCollection(userQuery);
  const profileData = userProfiles?.[0];

  // PART 2: Dynamic Post Count for public profiles
  const userPostsQuery = useMemoFirebase(() => {
    if (!db || !profileData) return null;
    return query(fsCollection(db, "posts"), where("uid", "==", profileData.id));
  }, [db, profileData]);
  const { data: userPosts } = useCollection(userPostsQuery);
  const dynamicPostCount = userPosts?.length || 0;

  const followRef = useMemoFirebase(() => {
    if (!db || !currentUser || !profileData) return null;
    return doc(db, "follows", `${currentUser.uid}_${profileData.id}`);
  }, [db, currentUser, profileData]);

  const { data: followDoc, isLoading: followLoading } = useDoc(followRef);
  const isFollowing = !!followDoc;

  const followingQuery = useMemoFirebase(() => (db && profileData ? query(fsCollection(db, "follows"), where("followerId", "==", profileData.id)) : null), [db, profileData]);
  const followersQuery = useMemoFirebase(() => (db && profileData ? query(fsCollection(db, "follows"), where("followedId", "==", profileData.id)) : null), [db, profileData]);
  const { data: followingData } = useCollection(followingQuery);
  const { data: followersData } = useCollection(followersQuery);

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
  if (!profileData) return <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-12 text-center"><p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Innovator Not Found</p><Button onClick={() => router.push("/")} className="rounded-full shadow-lg font-black uppercase text-[10px] px-8">Return Home</Button></div>;

  const colors: CustomColors = profileData.customColors || {};
  const stickers: Sticker[] = profileData.stickers || [];

  return (
    <div className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden flex flex-col" style={{ backgroundColor: colors.background || "var(--background)" }}>
      <div className="relative w-full">
        <div className="h-16 w-full" style={{ backgroundColor: colors.header }} />
        <header className="absolute top-0 left-0 right-0 px-6 py-5 flex justify-between items-center z-50">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft size={24} style={{ color: getContrastColor(colors.header) }} />
          </Button>
          <h1 className="text-lg font-black uppercase tracking-tighter" style={{ color: getContrastColor(colors.header) }}>@{profileData.username}</h1>
          <div className="w-10" />
        </header>

        <div className="relative">
          <div className="h-52 w-full relative overflow-hidden">
            <Image src={profileData.bannerUrl || `https://picsum.photos/seed/banner${profileData.id}/800/400`} alt="banner" fill className="object-cover" unoptimized />
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center relative z-20">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-2xl">
              <AvatarImage src={profileData.profilePictureUrl} className="object-cover" />
              <AvatarFallback className="text-2xl font-black uppercase">{profileData.username?.[0]}</AvatarFallback>
            </Avatar>
          </div>

          {/* Stickers Rendering */}
          <div className="absolute inset-0 pointer-events-none z-30">
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

      <div className="w-full relative mt-4">
        <div style={{ backgroundColor: colors.userInfo }} className="px-6 flex flex-col items-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(colors.userInfo) }}>{profileData.name || profileData.username}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(colors.userInfo) }}>Innovator Hub</p>
          
          <div className="flex gap-3 w-full mt-6 px-4">
            <Button className={cn("flex-1 rounded-2xl font-black uppercase text-[10px] h-11 shadow-xl", isFollowing ? "bg-muted text-foreground" : "bg-primary text-white")} onClick={handleFollowToggle} disabled={followLoading || profileData.id === currentUser?.uid}>
              {isFollowing ? <><UserCheck size={16} className="mr-2" /> Following</> : <><UserPlus size={16} className="mr-2" /> Follow</>}
            </Button>
            <Button variant="outline" className="flex-1 rounded-2xl font-black uppercase text-[10px] h-11 bg-white shadow-lg" onClick={() => router.push(`/chat/${profileData.id}`)}>
              <MessageSquare size={16} className="mr-2" /> Message
            </Button>
          </div>

          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-xl" style={{ backgroundColor: colors.bioCard || "#FFFFFF" }}>
            <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(colors.bioCard) }}>
              {profileData.bio || "Innovating the future, one idea at a time."}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: colors.statsSection }} className="w-full py-10 px-10">
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{dynamicPostCount}</p>
              <p className="text-[8px] uppercase font-black opacity-40" style={{ color: getContrastColor(colors.statsSection) }}>Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{followersData?.length || 0}</p>
              <p className="text-[8px] uppercase font-black opacity-40" style={{ color: getContrastColor(colors.statsSection) }}>Circle</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{followingData?.length || 0}</p>
              <p className="text-[8px] uppercase font-black opacity-40" style={{ color: getContrastColor(colors.statsSection) }}>Circling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
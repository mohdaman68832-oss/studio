
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Loader2, UserCog, Palette
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, collection as fsCollection, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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

export default function ProfilePage() {
  const { user, loading: isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const userPostsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      fsCollection(db, "posts"), 
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user?.uid]);

  const { data: userPosts, isLoading: isPostsLoading } = useCollection(userPostsQuery);
  const dynamicPostCount = userPosts?.length || 0;

  if (isUserLoading || isProfileLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-8 w-8" />
    </div>
  );
  if (!user) return null;

  const colors: CustomColors = profileData?.customColors || {};
  const stickers: Sticker[] = profileData?.stickers || [];
  const headerColor = colors.header || "var(--primary)";
  const contrastHeader = getContrastColor(colors.header);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative overflow-x-hidden flex flex-col" style={{ backgroundColor: colors.background || "var(--background)" }}>
      {/* Visual Sticker Layer */}
      <div className="absolute inset-0 pointer-events-none z-[60]">
        {stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className="absolute" 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})` 
            }}
          >
            <div className="relative w-24 h-24">
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized />
            </div>
          </div>
        ))}
      </div>

      <div className="relative w-full shrink-0">
        <div className="h-16 w-full" style={{ backgroundColor: headerColor }} />
        <header className="absolute top-0 left-0 right-0 px-6 py-5 flex justify-between items-center z-50">
          <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: contrastHeader }}>Sphere</h1>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Settings size={24} style={{ color: contrastHeader }} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-3xl p-2 border-2 bg-white/95 backdrop-blur-md">
              <DropdownMenuItem onClick={() => router.push('/profile/edit')} className="rounded-2xl h-10 gap-3 cursor-pointer">
                <Palette size={18} className="text-primary" />
                <span className="text-[10px] font-black uppercase">Optimize Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-2xl h-10 gap-3 text-secondary cursor-pointer">
                <LogOut size={18} />
                <span className="text-[10px] font-black uppercase">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="relative">
          <div className="h-56 w-full relative overflow-hidden">
            <Image 
              src={profileData?.bannerUrl || `https://picsum.photos/seed/banner${user.uid}/800/400`} 
              alt="banner" 
              fill 
              className="object-cover" 
              unoptimized 
            />
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center relative z-20">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-2xl">
              <AvatarImage src={profileData?.profilePictureUrl || user.photoURL || ""} className="object-cover" />
              <AvatarFallback className="text-2xl font-black">{profileData?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="w-full relative mt-4">
        <div style={{ backgroundColor: colors.userInfo }} className="px-6 flex flex-col items-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(colors.userInfo) }}>{profileData?.name || user.displayName || "Innovator"}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(colors.userInfo) }}>@{profileData?.username || "user"}</p>
          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-xl" style={{ backgroundColor: colors.bioCard || "hsl(var(--card))" }}>
            <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(colors.bioCard) }}>
              {profileData?.bio || "Innovating the future, one idea at a time."}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: colors.statsSection }} className="w-full py-10 px-10">
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{dynamicPostCount}</p>
              <p className="text-[8px] uppercase font-black opacity-40">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>0</p>
              <p className="text-[8px] uppercase font-black opacity-40">Circle</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>0</p>
              <p className="text-[8px] uppercase font-black opacity-40">Circling</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-10 space-y-6">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Your Innovations</span>
             <div className="flex-1 h-px bg-primary/10" />
          </div>
          
          <div className="space-y-8">
            {isPostsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : userPosts && userPosts.length > 0 ? (
              userPosts.map((post) => (
                <div key={post.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <IdeaCard idea={post as any} />
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest">No innovations published yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

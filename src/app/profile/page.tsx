
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Camera, 
  Loader2, 
  Image as LucideImage, Video, Type,
  X,
  UserCog,
  CheckCircle,
  Sun,
  Moon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc, collection, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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
  tabsList?: string;
  tabsContent?: string;
  background?: string;
  textOutline?: string;
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

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function ProfilePage() {
  const { user, loading: isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const stickerContainerRef = useRef<HTMLDivElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    profilePic: "",
    banner: "",
    bannerOffset: 50,
    stickers: [] as Sticker[],
    customColors: {} as CustomColors
  });

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const followingQuery = useMemoFirebase(() => (db && user ? query(collection(db, "follows"), where("followerId", "==", user.uid)) : null), [db, user]);
  const followersQuery = useMemoFirebase(() => (db && user ? query(collection(db, "follows"), where("followedId", "==", user.uid)) : null), [db, user]);
  
  const { data: circlingData } = useCollection(followingQuery);
  const { data: circleData } = useCollection(followersQuery);

  const myPostsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "ideas"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [db, user]);

  const { data: myPosts } = useCollection(myPostsQuery);

  const categorizedPosts = useMemo(() => {
    if (!myPosts) return { photos: [], videos: [], text: [] };
    
    return {
      photos: myPosts.filter(p => p.mediaUrl && !p.mediaUrl.includes('.mp4') && !p.mediaUrl.includes('gtv-videos-bucket')),
      videos: myPosts.filter(p => p.mediaUrl && (p.mediaUrl.includes('.mp4') || p.mediaUrl.includes('gtv-videos-bucket'))),
      text: myPosts.filter(p => !p.mediaUrl || p.mediaUrl === "")
    };
  }, [myPosts]);

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || user?.displayName || "",
        username: profileData.username || "",
        bio: profileData.bio || "",
        profilePic: profileData.profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || "",
        bannerOffset: profileData.bannerOffset || 50,
        stickers: profileData.stickers || [],
        customColors: profileData.customColors || {}
      });
      setIsDarkMode(profileData.theme === 'dark');
    }
  }, [profileData, user]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleSignOut = async () => { 
    await signOut(auth); 
    router.push("/login"); 
  };

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, {
        id: user.uid,
        name: formData.name,
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        bannerOffset: formData.bannerOffset,
        stickers: formData.stickers,
        customColors: formData.customColors,
        theme: isDarkMode ? 'dark' : 'light',
        updatedAt: new Date().toISOString()
      });

      toast({ title: "Profile Synced", description: "All changes updated successfully." });
      setTimeout(() => setIsOptimizeModalOpen(false), 300);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setFormData(prev => ({ ...prev, profilePic: base64 }));
      else if (type === 'banner') setFormData(prev => ({ ...prev, banner: base64 }));
    }
  };

  if (isUserLoading || isProfileLoading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (!user) return null;

  const outlineColor = formData.customColors.textOutline || "transparent";
  const textShadowStyle = outlineColor !== "transparent" 
    ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`
    : "none";

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col transition-all duration-500 overflow-x-hidden no-scrollbar" style={{ backgroundColor: formData.customColors.background || "var(--background)" }}>
      <div className="relative w-full shrink-0">
        <div className="h-16 w-full relative z-[70]" style={{ backgroundColor: formData.customColors.header }} />
        <header className="absolute top-0 left-0 right-0 z-[80] px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Sphere</h1>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings size={24} style={{ color: getContrastColor(formData.customColors.header) }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[2.5rem] p-3 z-[2000] border-2 border-primary/10 shadow-2xl bg-white/95 backdrop-blur-md">
              <DropdownMenuItem onClick={() => setIsOptimizeModalOpen(true)} className="rounded-[1.5rem] h-12 cursor-pointer gap-3 hover:bg-primary/5">
                <UserCog size={18} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Optimize Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="rounded-[1.5rem] h-12 cursor-pointer gap-3 text-secondary hover:bg-secondary/5">
                <LogOut size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="relative w-full" ref={stickerContainerRef}>
          <div className="relative h-56 w-full overflow-hidden z-[10]">
            <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized />
          </div>
          <div className="relative px-6 -mt-16 flex flex-col items-center z-[50]">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-2xl">
              <AvatarImage src={formData.profilePic} className="object-cover" />
              <AvatarFallback className="text-2xl font-black uppercase">{formData.name?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="relative z-[40] w-full -mt-1">
        <div style={{ backgroundColor: formData.customColors.userInfo }} className="px-6 flex flex-col items-center pb-8">
          <div className="text-center mt-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo), textShadow: textShadowStyle }}>{formData.name || "Innovator"}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(formData.customColors.userInfo), textShadow: textShadowStyle }}>@{formData.username}</p>
          </div>
          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-xl border-border/50" style={{ backgroundColor: formData.customColors.bioCard || "hsl(var(--card))" }}>
            <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
              {formData.bio || "Innovating the future, one idea at a time."}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: formData.customColors.statsSection }} className="w-full py-10 px-10 relative">
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{profileData?.totalIdeasPosted || 0}</p>
              <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Post</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{circleData?.length || 0}</p>
              <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Circle</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{circlingData?.length || 0}</p>
              <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Circling</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: formData.customColors.tabsContent }} className="flex-1 relative z-[40] pb-32">
        <Tabs defaultValue="photo" className="w-full">
          <TabsList className="w-full bg-transparent h-14 border-b border-border/20" style={{ backgroundColor: formData.customColors.tabsList }}>
            <TabsTrigger value="photo" className="flex-1 border-b-4 border-transparent data-[state=active]:border-primary transition-all">
              <LucideImage size={20} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 border-b-4 border-transparent data-[state=active]:border-primary transition-all">
              <Video size={20} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1 border-b-4 border-transparent data-[state=active]:border-primary transition-all">
              <Type size={20} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
          </TabsList>
          
          <div className="p-4 space-y-6">
            <TabsContent value="photo" className="space-y-6">
              {categorizedPosts.photos.length > 0 ? (
                categorizedPosts.photos.map(p => <IdeaCard key={p.id} idea={p as any} />)
              ) : (
                <div className="py-24 text-center opacity-20">
                  <LucideImage size={48} className="mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Photos Shared Yet</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="video" className="space-y-6">
              {categorizedPosts.videos.length > 0 ? (
                categorizedPosts.videos.map(p => <IdeaCard key={p.id} idea={p as any} />)
              ) : (
                <div className="py-24 text-center opacity-20">
                  <Video size={48} className="mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Videos Shared Yet</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="text" className="space-y-6">
              {categorizedPosts.text.length > 0 ? (
                categorizedPosts.text.map(p => <IdeaCard key={p.id} idea={p as any} />)
              ) : (
                <div className="py-24 text-center opacity-20">
                  <Type size={48} className="mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Text Posts Shared Yet</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog open={isOptimizeModalOpen} onOpenChange={setIsOptimizeModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[85vh] flex flex-col z-[5000]" onOpenAutoFocus={e => e.preventDefault()}>
          <div className="p-8 border-b shrink-0 bg-white/50 backdrop-blur-sm flex items-center justify-between">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Optimize Profile</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOptimizeModalOpen(false)} className="rounded-full"><X /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
            <div className="flex items-center justify-between bg-muted/20 p-6 rounded-[2.5rem] border border-primary/10 shadow-sm">
              <div className="flex items-center gap-4">
                {isDarkMode ? <Moon className="text-primary w-6 h-6" /> : <Sun className="text-primary w-6 h-6" />}
                <div><p className="text-[10px] font-black uppercase tracking-widest">Dark Mode Theme</p></div>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Sphere Banner</Label>
              <div onClick={() => bannerInputRef.current?.click()} className="relative h-40 bg-muted rounded-[3rem] overflow-hidden border-2 border-dashed border-primary/20 cursor-pointer group shadow-inner">
                {formData.banner ? <Image src={formData.banner} alt="banner preview" fill className="object-cover transition-transform group-hover:scale-105" unoptimized /> : <Camera className="absolute inset-0 m-auto opacity-10" size={40} />}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera /></div>
              </div>
            </div>

            <div className="space-y-6">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Identity Hub</Label>
              <div className="flex gap-6 items-center">
                <div className="relative group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                   <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                    <AvatarImage src={formData.profilePic} className="object-cover" />
                    <AvatarFallback className="text-xl font-black">{formData.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={20} /></div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase opacity-40 ml-1">Display Name</Label>
                    <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Public Name" className="h-12 rounded-2xl font-bold text-sm bg-muted/30 border-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Expertise Bio</Label>
              <Textarea value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} placeholder="Tell your innovation story..." className="rounded-[2rem] min-h-[100px] text-sm p-5 font-medium border-muted shadow-inner" />
            </div>
          </div>
          <div className="p-8 bg-white/80 backdrop-blur-md border-t shrink-0">
            <Button className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-transform" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-3" /> : <CheckCircle className="mr-3" />}
              {isSaving ? "Syncing..." : "Apply Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'profile')} />
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'banner')} />
    </div>
  );
}

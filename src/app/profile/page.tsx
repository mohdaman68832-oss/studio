
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Loader2, Palette, Plus, Move, Maximize2, RotateCw, Check, X, Camera, Image as ImageIcon, Sticker as StickerIcon, Trash2, Video, Type
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, collection as fsCollection, query, where, orderBy, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { IdeaCard } from "@/components/feed/idea-card";
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

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

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
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isStickerSheetOpen, setIsStickerSheetOpen] = useState(false);
  
  const [localProfile, setLocalProfile] = useState({
    name: "",
    bio: "",
    profilePic: "",
    banner: "",
    stickers: [] as Sticker[],
    customColors: {} as CustomColors
  });

  const [dragStart, setDragStart] = useState<{ x: number, y: number, stickerX: number, stickerY: number } | null>(null);

  const stickerInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileData) {
      setLocalProfile({
        name: profileData.name || user?.displayName || "Innovator",
        bio: profileData.bio || "Innovating the future...",
        profilePic: profileData.profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || "",
        stickers: profileData.stickers || [],
        customColors: profileData.customColors || {
          header: "#FF4500",
          userInfo: "#FDF6F2",
          bioCard: "#FFFFFF",
          statsSection: "#FDF6F2",
          background: "#FDF6F2"
        }
      });
    }
  }, [profileData, user]);

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

  // Real-time Follow Metrics
  const circlingQuery = useMemoFirebase(() => (db && user?.uid ? query(fsCollection(db, "follows"), where("followerId", "==", user.uid)) : null), [db, user?.uid]);
  const circleQuery = useMemoFirebase(() => (db && user?.uid ? query(fsCollection(db, "follows"), where("followedId", "==", user.uid)) : null), [db, user?.uid]);
  
  const { data: circlingData } = useCollection(circlingQuery);
  const { data: circleData } = useCollection(circleQuery);

  const handleSave = async () => {
    if (!profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, {
        name: localProfile.name,
        bio: localProfile.bio,
        profilePictureUrl: localProfile.profilePic,
        bannerUrl: localProfile.banner,
        stickers: localProfile.stickers,
        customColors: localProfile.customColors,
        updatedAt: serverTimestamp()
      });
      setIsEditMode(false);
      toast({ title: "Profile Locked", description: "All changes have been saved." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed", description: "Try again later." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner' | 'sticker') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setLocalProfile(p => ({ ...p, profilePic: base64 }));
      else if (type === 'banner') setLocalProfile(p => ({ ...p, banner: base64 }));
      else if (type === 'sticker') {
        const id = Math.random().toString(36).substr(2, 9);
        const newSticker: Sticker = { id, url: base64, x: 50, y: 30, rotation: 0, scale: 1 };
        setLocalProfile(p => ({ ...p, stickers: [...p.stickers, newSticker] }));
        setSelectedStickerId(id);
        setIsStickerSheetOpen(true);
      }
    }
  };

  const updateSticker = (id: string, property: keyof Sticker, value: number) => {
    setLocalProfile(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === id ? { ...s, [property]: value } : s)
    }));
  };

  const removeSticker = (id: string) => {
    setLocalProfile(prev => ({ ...prev, stickers: prev.stickers.filter(s => s.id !== id) }));
    setSelectedStickerId(null);
    setIsStickerSheetOpen(false);
  };

  const handleStickerPointerDown = (e: React.PointerEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    
    const sticker = localProfile.stickers.find(s => s.id === id);
    if (!sticker) return;

    setSelectedStickerId(id);
    
    if (isStickerSheetOpen && selectedStickerId === id) {
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        stickerX: sticker.x,
        stickerY: sticker.y
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      setIsStickerSheetOpen(true);
    }
  };

  const handleStickerPointerMove = (e: React.PointerEvent, id: string) => {
    if (!dragStart || !isEditMode || selectedStickerId !== id || !isStickerSheetOpen) return;
    
    const container = document.getElementById('profile-scroll-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, dragStart.stickerX + dx));
    // Limit vertical dragging to not overlap with posts (invisible line)
    const newY = Math.max(0, Math.min(60, dragStart.stickerY + dy));

    updateSticker(id, 'x', newX);
    updateSticker(id, 'y', newY);
  };

  const handleStickerPointerUp = (e: React.PointerEvent) => {
    if (dragStart) {
      setDragStart(null);
    }
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-8 w-8" />
    </div>
  );
  if (!user) return null;

  const colors = localProfile.customColors;
  const headerColor = colors.header || "var(--primary)";
  const contrastHeader = getContrastColor(headerColor);
  const selectedSticker = localProfile.stickers.find(s => s.id === selectedStickerId);

  const filteredPosts = (type: string) => {
    if (!userPosts) return [];
    return userPosts.filter(p => p.mediaType === type);
  };

  return (
    <div 
      id="profile-scroll-container"
      className="max-w-md mx-auto min-h-screen pb-24 relative overflow-x-hidden flex flex-col" 
      style={{ backgroundColor: colors.background || "var(--background)" }}
    >
      {/* LAYER 1: Media (Banner/Logo) - Z-10 */}
      <div className="relative w-full shrink-0 z-10">
        <div className="h-16 w-full" style={{ backgroundColor: headerColor }} />
        <header className="absolute top-0 left-0 right-0 px-6 py-5 flex justify-between items-center z-[50]">
          {isEditMode ? (
             <Button variant="ghost" size="icon" onClick={() => setIsEditMode(false)} className="rounded-full bg-black/20 backdrop-blur-md">
               <X size={24} className="text-white" />
             </Button>
          ) : (
            <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: contrastHeader }}>Sphere</h1>
          )}
          
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Button onClick={handleSave} disabled={isSaving} className="rounded-full h-10 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} className="mr-2" /> Save All</>}
              </Button>
            ) : (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><Settings size={24} style={{ color: contrastHeader }} /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-3xl p-2 border-2 bg-white/95 backdrop-blur-md">
                  <DropdownMenuItem onClick={() => setIsEditMode(true)} className="rounded-2xl h-10 gap-3 cursor-pointer">
                    <Palette size={18} className="text-primary" />
                    <span className="text-[10px] font-black uppercase">Personalize</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-2xl h-10 gap-3 text-secondary cursor-pointer">
                    <LogOut size={18} />
                    <span className="text-[10px] font-black uppercase">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <div className="relative">
          <div className="h-56 w-full relative overflow-hidden group">
            <Image 
              src={localProfile.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} 
              alt="banner" 
              fill 
              className="object-cover" 
              unoptimized 
            />
            {isEditMode && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10" onClick={() => bannerInputRef.current?.click()}>
                <Camera size={32} className="text-white" />
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
              </div>
            )}
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center relative z-20">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-lg">
                <AvatarImage src={localProfile.profilePic} className="object-cover" />
                <AvatarFallback className="text-2xl font-black">{localProfile.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              {isEditMode && (
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                  <Camera size={24} className="text-white" />
                  <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LAYER 2: Stickers - Z-20 (Above Logo/Banner, Below Text) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {localProfile.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className={cn(
              "absolute", 
              isEditMode ? "pointer-events-auto cursor-pointer" : "pointer-events-none"
            )} 
            onPointerDown={(e) => handleStickerPointerDown(e, sticker.id)}
            onPointerMove={(e) => handleStickerPointerMove(e, sticker.id)}
            onPointerUp={handleStickerPointerUp}
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              touchAction: 'none'
            }}
          >
            <div className={cn(
              "relative w-24 h-24 transition-all duration-200",
              isEditMode && selectedStickerId === sticker.id && "ring-4 ring-primary ring-offset-4 rounded-xl scale-105"
            )}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized />
            </div>
          </div>
        ))}
      </div>

      {/* LAYER 3: Text & Bio Card - Z-30 (Always on top of stickers) */}
      <div className="w-full relative mt-4 z-30">
        <div style={{ backgroundColor: colors.userInfo }} className="px-6 flex flex-col items-center relative">
          {isEditMode ? (
            <div className="w-full space-y-4 pt-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Name</Label>
                <input value={localProfile.name} onChange={e => setLocalProfile(p => ({ ...p, name: e.target.value }))} className="w-full text-center font-black uppercase text-xl h-14 rounded-2xl border-primary/20 bg-white/50 outline-none" placeholder="Your Name" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Mission Bio</Label>
                <Textarea value={localProfile.bio} onChange={e => setLocalProfile(p => ({ ...p, bio: e.target.value }))} className="text-center font-medium text-xs rounded-2xl border-primary/20 min-h-[100px] bg-white/50" placeholder="What are you building?" />
              </div>
              
              <div className="grid grid-cols-5 gap-3 pt-2">
                {(Object.keys(localProfile.customColors) as Array<keyof CustomColors>).map(key => (
                   <div key={key} className="flex flex-col items-center gap-1">
                     <input type="color" value={localProfile.customColors[key]} onChange={e => setLocalProfile(p => ({ ...p, customColors: { ...p.customColors, [key]: e.target.value } }))} className="w-full h-10 rounded-xl cursor-pointer bg-white p-1 border shadow-sm ring-primary/20 focus:ring-2" />
                     <span className="text-[7px] font-black uppercase opacity-40 truncate w-full text-center">{key}</span>
                   </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(colors.userInfo) }}>{localProfile.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(colors.userInfo) }}>@{profileData?.username || "user"}</p>
              
              <div 
                className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-[0_40px_80px_-10px_rgba(0,0,0,0.4)] border-primary/5 relative z-[60]" 
                style={{ backgroundColor: colors.bioCard || "hsl(var(--card))" }}
              >
                <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(colors.bioCard) }}>
                  {localProfile.bio}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Stats & Content Section - Overlapped by Bio Shadow */}
        <div className="relative z-10">
          <div style={{ backgroundColor: colors.statsSection }} className="w-full py-10 px-10 relative">
            <div className="grid grid-cols-3 gap-6 w-full">
              <div className="text-center">
                <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{dynamicPostCount}</p>
                <p className="text-[8px] uppercase font-black opacity-40">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{circleData?.length || 0}</p>
                <p className="text-[8px] uppercase font-black opacity-40">Circle</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(colors.statsSection) }}>{circlingData?.length || 0}</p>
                <p className="text-[8px] uppercase font-black opacity-40">Circling</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-10 space-y-8 relative bg-background">
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="w-full h-14 bg-muted/30 rounded-full p-1 mb-8">
                <TabsTrigger value="image" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ImageIcon size={14} /> Images
                </TabsTrigger>
                <TabsTrigger value="video" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Video size={14} /> Videos
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Type size={14} /> Ideas
                </TabsTrigger>
              </TabsList>

              {["image", "video", "text"].map((type) => (
                <TabsContent key={type} value={type} className="outline-none space-y-8">
                  {isPostsLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                  ) : filteredPosts(type).length > 0 ? (
                    filteredPosts(type).map((post) => (
                      <div key={post.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <IdeaCard idea={post as any} isProfileView={true} />
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4 opacity-30">
                      <p className="text-[10px] font-black uppercase tracking-widest">No {type} posts found</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {isEditMode && (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-3">
          <Button onClick={() => stickerInputRef.current?.click()} className="h-16 w-16 rounded-full bg-secondary text-white shadow-2xl animate-in zoom-in duration-300 border-4 border-white">
            <Plus size={32} />
          </Button>
          <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'sticker')} />
        </div>
      )}

      {/* LAYER 4: Fine-Tune Sticker Hub - Z-2000 (Always on top of BottomNav) */}
      <Sheet open={isStickerSheetOpen} onOpenChange={setIsStickerSheetOpen} modal={false}>
        <SheetContent 
          side="bottom" 
          hideOverlay={true}
          className="rounded-t-[3rem] h-auto max-h-[60vh] bg-white/95 backdrop-blur-xl border-t-2 border-primary/10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] p-0 overflow-hidden flex flex-col pointer-events-auto z-[2000]"
        >
          <SheetHeader className="p-4 border-b flex flex-row items-center justify-between bg-white/50 space-y-0">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg"><StickerIcon size={16} className="text-primary"/></div>
              <SheetTitle className="text-sm font-black uppercase tracking-tight text-primary">Fine-Tune Sticker</SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsStickerSheetOpen(false)} className="rounded-full h-8 w-8 bg-muted/50 hover:bg-muted"><Check size={18}/></Button>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pb-10 space-y-5 no-scrollbar">
            {selectedSticker && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground"><RotateCw size={14} className="text-primary"/> Rotation Hub</span>
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{selectedSticker.rotation}°</span>
                    </div>
                    <Slider value={[selectedSticker.rotation]} min={0} max={360} step={1} onValueChange={([v]) => updateSticker(selectedSticker.id, 'rotation', v)} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground"><Maximize2 size={14} className="text-secondary"/> Sphere Size</span>
                      <span className="text-[10px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">{selectedSticker.scale.toFixed(1)}x</span>
                    </div>
                    <Slider value={[selectedSticker.scale]} min={0.5} max={4} step={0.1} onValueChange={([v]) => updateSticker(selectedSticker.id, 'scale', v)} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-2xl border-2 border-destructive/10 text-destructive font-black uppercase text-[10px] hover:bg-destructive hover:text-white transition-all gap-2" 
                    onClick={() => removeSticker(selectedSticker.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                  <Button 
                    className="flex-1 h-12 rounded-2xl bg-primary text-white font-black uppercase text-[10px] shadow-lg shadow-primary/20 gap-2" 
                    onClick={() => setIsStickerSheetOpen(false)}
                  >
                    <Check size={14} /> Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

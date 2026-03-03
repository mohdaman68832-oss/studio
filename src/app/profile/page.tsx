
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Camera, 
  Loader2, 
  UserCog,
  Palette,
  Sticker as StickerIcon,
  X,
  LayoutGrid,
  Move,
  Maximize2,
  RotateCw,
  Plus,
  Pencil,
  Image as ImageIcon,
  Check,
  ChevronLeft
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc, collection as fsCollection, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { IdeaCard } from "@/components/feed/idea-card";

interface Sticker {
  id: string;
  url: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
  scale: number; // multiplier
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

  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const customStickerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profilePic: "",
    banner: "",
    bannerOffset: 50,
    stickers: [] as Sticker[],
    customColors: {} as CustomColors
  });

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

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || user?.displayName || "",
        bio: profileData.bio || "",
        profilePic: profileData.profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || "",
        bannerOffset: profileData.bannerOffset || 50,
        stickers: profileData.stickers || [],
        customColors: profileData.customColors || {}
      });
    }
  }, [profileData, user]);

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, {
        stickers: formData.stickers,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Profile Locked", description: "All stickers saved in place." });
      setIsEditingMode(false);
      setSelectedStickerId(null);
      setIsSheetOpen(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Failed to lock profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner' | 'sticker') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setFormData(prev => ({ ...prev, profilePic: base64 }));
      else if (type === 'banner') setFormData(prev => ({ ...prev, banner: base64 }));
      else if (type === 'sticker') {
        const newStickerId = addSticker(base64);
        setSelectedStickerId(newStickerId);
        setIsSheetOpen(true);
      }
    }
  };

  const addSticker = (url: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSticker: Sticker = {
      id,
      url, 
      x: 50, 
      y: 30, 
      rotation: 0, 
      scale: 1
    };
    setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
    return id;
  };

  const updateStickerProperty = (id: string, property: keyof Sticker, value: number) => {
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === id ? { ...s, [property]: value } : s)
    }));
  };

  const removeSticker = (id: string) => {
    setFormData(prev => ({ ...prev, stickers: prev.stickers.filter(s => s.id !== id) }));
    setSelectedStickerId(null);
    setIsSheetOpen(false);
  };

  const handleStickerClick = (id: string) => {
    if (!isEditingMode) return;
    setSelectedStickerId(id);
    setIsSheetOpen(true);
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-8 w-8" />
    </div>
  );
  if (!user) return null;

  const headerColor = formData.customColors.header || "var(--primary)";
  const contrastHeader = getContrastColor(formData.customColors.header);
  const selectedSticker = formData.stickers.find(s => s.id === selectedStickerId);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative overflow-x-hidden flex flex-col" style={{ backgroundColor: formData.customColors.background || "var(--background)" }}>
      {/* Visual Sticker Layer */}
      <div className={cn("absolute inset-0 z-[60]", isEditingMode ? "pointer-events-auto" : "pointer-events-none")}>
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className={cn("absolute transition-all cursor-pointer", isEditingMode && "hover:ring-2 hover:ring-primary/40 rounded-lg")} 
            onClick={() => handleStickerClick(sticker.id)}
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})` 
            }}
          >
            <div className={cn(
              "relative w-24 h-24",
              selectedStickerId === sticker.id && isEditingMode && "ring-4 ring-primary ring-offset-2 rounded-xl"
            )}>
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
              <DropdownMenuItem onClick={() => setIsEditingMode(true)} className="rounded-2xl h-10 gap-3 cursor-pointer">
                <StickerIcon size={18} className="text-primary" />
                <span className="text-[10px] font-black uppercase">Personalize</span>
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
            <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized />
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center relative z-20">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-2xl">
              <AvatarImage src={formData.profilePic} className="object-cover" />
              <AvatarFallback className="text-2xl font-black">{formData.name?.[0] || user.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="w-full relative mt-4">
        {isEditingMode && (
          <div className="px-6 mb-4 flex gap-2 animate-in slide-in-from-top-4">
            <Button 
              onClick={() => customStickerInputRef.current?.click()} 
              className="flex-1 h-12 rounded-2xl bg-secondary text-white font-black uppercase text-[10px] tracking-widest shadow-lg"
            >
              <Plus size={16} className="mr-2" /> Add Sticker
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving}
              className="flex-1 h-12 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} className="mr-2" /> Done</>}
            </Button>
            <input type="file" ref={customStickerInputRef} className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'sticker')} />
          </div>
        )}

        <div style={{ backgroundColor: formData.customColors.userInfo }} className="px-6 flex flex-col items-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || "Innovator"}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(formData.customColors.userInfo) }}>@{profileData?.username || "user"}</p>
          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-xl" style={{ backgroundColor: formData.customColors.bioCard || "hsl(var(--card))" }}>
            <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
              {formData.bio || "Innovating the future, one idea at a time."}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: formData.customColors.statsSection }} className="w-full py-10 px-10">
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{dynamicPostCount}</p>
              <p className="text-[8px] uppercase font-black opacity-40">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>0</p>
              <p className="text-[8px] uppercase font-black opacity-40">Circle</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>0</p>
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
                <LayoutGrid size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">No innovations published yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white h-[60vh] flex flex-col">
          <SheetHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
            <SheetTitle className="text-xl font-black uppercase text-primary">Adjust Sticker</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="rounded-full"><X size={20} /></Button>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {selectedSticker && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase flex items-center gap-2"><Move size={14}/> Horizontal (X)</Label><span className="text-[10px] font-bold">{selectedSticker.x}%</span></div>
                    <Slider value={[selectedSticker.x]} max={100} step={1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'x', v)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase flex items-center gap-2"><Move size={14}/> Vertical (Y)</Label><span className="text-[10px] font-bold">{selectedSticker.y}%</span></div>
                    <Slider value={[selectedSticker.y]} max={100} step={1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'y', v)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase flex items-center gap-2"><Maximize2 size={14}/> Size (Scale)</Label><span className="text-[10px] font-bold">{selectedSticker.scale.toFixed(1)}x</span></div>
                    <Slider value={[selectedSticker.scale]} min={0.5} max={3} step={0.1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'scale', v)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase flex items-center gap-2"><RotateCw size={14}/> Rotation</Label><span className="text-[10px] font-bold">{selectedSticker.rotation}°</span></div>
                    <Slider value={[selectedSticker.rotation]} min={0} max={360} step={1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'rotation', v)} />
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 rounded-2xl border-2 border-destructive/20 text-destructive font-black uppercase text-[10px] tracking-widest hover:bg-destructive hover:text-white transition-all"
                    onClick={() => removeSticker(selectedSticker.id)}
                  >
                    Remove
                  </Button>
                  <Button 
                    className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Done
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

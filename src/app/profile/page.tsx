
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Grid, Bookmark, Heart, LogOut, Camera, Image as ImageIcon, Plus, Trash2, RotateCw, Maximize, X, PaintBucket, Pencil, Loader2, Monitor, Smartphone, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

const PALETTE = [
  "#FFFFFF", "#FDF2F2", "#F0FDF4", "#EFF6FF", "#FFFBEB",
  "#008080", "#FF4500", "#FFD700", "#4CAF50", "#2196F3",
  "#9C27B0", "#E91E63", "#000000", "#F2F3F5"
];

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return 'inherit';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? '#1A1A1A' : '#FFFFFF';
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [draggedStickerId, setDraggedStickerId] = useState<string | null>(null);
  
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [tempBannerUrl, setTempBannerUrl] = useState<string | null>(null);
  const [bannerOffset, setBannerOffset] = useState(50);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [isPaintMode, setIsPaintMode] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.username || user?.displayName || "",
        bio: profileData.bio || "",
        profilePic: profileData.profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || "",
        bannerOffset: profileData.bannerOffset || 50,
        stickers: profileData.stickers || [],
        customColors: profileData.customColors || {}
      });
      setBannerOffset(profileData.bannerOffset || 50);
    }
  }, [profileData, user]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const saveToFirestore = async (updates: any) => {
    if (!profileRef) return;
    try {
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Auto-save failed:", error);
    }
  };

  const applyColor = async (zone: keyof CustomColors) => {
    if (!activeColor || !isPaintMode) return;
    const updatedColors = { ...formData.customColors, [zone]: activeColor };
    setFormData(prev => ({ ...prev, customColors: updatedColors }));
    await saveToFirestore({ customColors: updatedColors });
  };

  const handleZoneClick = (e: React.MouseEvent, zone: keyof CustomColors) => {
    if (isPaintMode) {
      e.stopPropagation();
      applyColor(zone);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { 
        displayName: formData.name,
        photoURL: formData.profilePic || user.photoURL
      });
      await updateDoc(profileRef, {
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        bannerOffset: formData.bannerOffset,
        stickers: formData.stickers,
        customColors: formData.customColors,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Success", description: "Profile saved!" });
      setIsEditModalOpen(false);
      setActiveStickerId(null);
      setIsPaintMode(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const updateActiveSticker = (updates: Partial<Sticker>) => {
    if (!activeStickerId) return;
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === activeStickerId ? { ...s, ...updates } : s)
    }));
  };

  const handleStickerPointerDown = (e: React.PointerEvent, stickerId: string) => {
    if (activeStickerId !== stickerId || isPaintMode) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    setDraggedStickerId(stickerId);
  };

  const handleStickerPointerMove = (e: React.PointerEvent, stickerId: string) => {
    if (draggedStickerId !== stickerId || !containerRef.current || isPaintMode) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === stickerId ? { ...s, x, y } : s)
    }));
  };

  const handleStickerPointerUp = async (e: React.PointerEvent, stickerId: string) => {
    if (draggedStickerId === stickerId) {
      try {
        const el = e.currentTarget as HTMLElement;
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
      setDraggedStickerId(null);
      await saveToFirestore({ stickers: formData.stickers });
    }
  };

  const handleBannerDragStart = (e: React.PointerEvent) => {
    setIsDraggingBanner(true);
    setDragStartY(e.clientY);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleBannerDragMove = (e: React.PointerEvent) => {
    if (!isDraggingBanner) return;
    const deltaY = e.clientY - dragStartY;
    const newOffset = Math.max(0, Math.min(100, bannerOffset - (deltaY / 2)));
    setBannerOffset(newOffset);
    setDragStartY(e.clientY);
  };

  const handleBannerDragEnd = (e: React.PointerEvent) => {
    setIsDraggingBanner(false);
    try {
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner' | 'sticker') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        if (type === 'profile') {
          setFormData(prev => ({ ...prev, profilePic: base64 }));
          if (user) await updateProfile(user, { photoURL: base64 });
          await saveToFirestore({ profilePictureUrl: base64 });
        } else if (type === 'banner') {
          setTempBannerUrl(base64);
          setShowBannerEditor(true);
          setIsEditModalOpen(false);
        } else if (type === 'sticker') {
          const newStickerId = Math.random().toString(36).substr(2, 9);
          const newSticker: Sticker = { id: newStickerId, url: base64, x: 50, y: 20, rotation: 0, scale: 1 };
          const updatedStickers = [...formData.stickers, newSticker];
          setFormData(prev => ({ ...prev, stickers: updatedStickers }));
          await saveToFirestore({ stickers: updatedStickers });
          setActiveStickerId(newStickerId);
          setIsEditModalOpen(false);
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not process image." });
      }
    }
  };

  const handleBannerSave = async () => {
    if (tempBannerUrl) {
      setFormData(prev => ({ ...prev, banner: tempBannerUrl, bannerOffset }));
      await saveToFirestore({ bannerUrl: tempBannerUrl, bannerOffset });
      setShowBannerEditor(false);
      setIsEditModalOpen(true);
      toast({ title: "Banner Updated", description: "Your banner looks great!" });
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen pt-0 space-y-4 bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="px-6 -mt-16 flex flex-col items-center gap-4">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
      onClick={(e) => handleZoneClick(e, 'background')}
    >
      {showBannerEditor && (
        <div className="fixed inset-0 z-[1000] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b bg-white">
            <Button variant="ghost" size="icon" onClick={() => setShowBannerEditor(false)} className="rounded-full">
              <ChevronLeft size={24} />
            </Button>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Reposition Banner</h2>
            <div className="w-10" />
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            <div className="text-center space-y-2">
               <p className="text-[10px] font-black uppercase text-secondary tracking-widest">Select Area</p>
               <p className="text-xs text-muted-foreground font-medium leading-relaxed">Drag the photo up or down to manually select the area you want to show.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor size={16} />
                <span className="text-[10px] font-black uppercase">PC Desktop Preview</span>
              </div>
              <div 
                className="relative aspect-[3/1] w-full bg-black rounded-2xl overflow-hidden border-4 border-white shadow-2xl cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={handleBannerDragStart}
                onPointerMove={handleBannerDragMove}
                onPointerUp={handleBannerDragEnd}
                onPointerLeave={handleBannerDragEnd}
              >
                {tempBannerUrl && (
                  <Image 
                    src={tempBannerUrl} 
                    alt="PC Preview" 
                    fill 
                    className="object-cover select-none pointer-events-none" 
                    style={{ objectPosition: `50% ${bannerOffset}%` }}
                    unoptimized={tempBannerUrl.startsWith('data:')}
                  />
                )}
                <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none"></div>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full backdrop-blur-md">Drag to Move</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone size={16} />
                <span className="text-[10px] font-black uppercase">Mobile Preview</span>
              </div>
              <div className="flex justify-center">
                <div 
                  className="relative w-full max-w-[240px] aspect-[4/3] bg-black rounded-3xl overflow-hidden border-8 border-white shadow-2xl cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={handleBannerDragStart}
                  onPointerMove={handleBannerDragMove}
                  onPointerUp={handleBannerDragEnd}
                  onPointerLeave={handleBannerDragEnd}
                >
                  {tempBannerUrl && (
                    <Image 
                      src={tempBannerUrl} 
                      alt="Mobile Preview" 
                      fill 
                      className="object-cover select-none pointer-events-none" 
                      style={{ objectPosition: `50% ${bannerOffset}%` }}
                      unoptimized={tempBannerUrl.startsWith('data:')}
                    />
                  )}
                  <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none"></div>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-4">
               <Button 
                onClick={handleBannerSave}
                className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
               >
                 Confirm & Apply Selection
               </Button>
               <Button 
                variant="outline" 
                onClick={() => bannerInputRef.current?.click()} 
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest border-muted text-muted-foreground"
               >
                 Choose Different Photo
               </Button>
            </div>
          </div>
        </div>
      )}

      {isPaintMode && activeColor && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[800] bg-white px-6 py-2 rounded-full shadow-2xl border-2 border-primary flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: activeColor }}></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Paint Mode Active</p>
          <button className="h-6 w-6 p-0 rounded-full hover:bg-muted flex items-center justify-center" onClick={() => { setIsPaintMode(false); setActiveColor(null); }}><X size={14}/></button>
        </div>
      )}

      <div 
        onClick={(e) => handleZoneClick(e, 'header')}
        className={cn(
          "px-6 flex justify-between items-center relative z-20 py-4 transition-colors duration-300",
          isPaintMode ? "cursor-crosshair" : "cursor-pointer"
        )}
        style={{ backgroundColor: formData.customColors.header }}
      >
        <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Profile</h1>
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("rounded-full", isPaintMode && "pointer-events-none opacity-50")}>
              <Settings size={22} style={{ color: getContrastColor(formData.customColors.header) }} />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] p-6 border-none z-[500]">
            <SheetHeader className="mb-4 text-center">
              <SheetTitle className="text-sm font-black uppercase tracking-widest text-center">Profile Options</SheetTitle>
            </SheetHeader>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4" onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}><Pencil size={18} /> Customize Profile</Button>
              <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-14 rounded-2xl gap-4 text-secondary"><LogOut size={18} /> Sign Out</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div 
        onClick={(e) => handleZoneClick(e, 'userInfo')}
        className={cn(
          "transition-colors duration-300 pb-8 relative z-10",
          isPaintMode ? "cursor-crosshair" : "cursor-pointer"
        )}
        style={{ backgroundColor: formData.customColors.userInfo }}
      >
        <div className="relative h-48 w-full bg-muted overflow-hidden">
          <Image 
            src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} 
            alt="banner" 
            fill 
            className="object-cover" 
            style={{ objectPosition: `50% ${formData.bannerOffset}%` }}
            draggable={false}
            unoptimized={!!formData.banner && formData.banner.startsWith('data:')}
          />
        </div>

        <div className="px-6 -mt-16 flex flex-col items-center relative z-10">
          <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-lg">
            <AvatarImage src={formData.profilePic} />
            <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="text-center mt-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>
              {formData.name || user.displayName || "Innovator"}
            </h2>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60" style={{ color: getContrastColor(formData.customColors.userInfo) }}>
              @{profileData?.username || "user"}
            </p>
          </div>
          
          <div 
            onClick={(e) => handleZoneClick(e, 'bioCard')}
            className={cn(
              "p-6 rounded-[2.5rem] border w-full mt-6 transition-colors duration-300 shadow-sm",
              isPaintMode ? "cursor-crosshair" : "cursor-pointer"
            )}
            style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}
          >
            <p className="text-center text-xs leading-relaxed font-medium italic break-all overflow-hidden" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
              {formData.bio || "Crafting new ideas daily."}
            </p>
          </div>
        </div>
      </div>

      <div 
        onClick={(e) => handleZoneClick(e, 'statsSection')}
        className={cn(
          "px-6 mb-6 relative z-10 transition-colors duration-300",
          isPaintMode ? "cursor-crosshair" : "cursor-pointer"
        )}
        style={{ backgroundColor: formData.customColors.statsSection }}
      >
        <div 
          className="grid grid-cols-3 gap-8 w-full py-6 px-4 rounded-[2rem] border transition-colors shadow-sm"
          style={{ backgroundColor: formData.customColors.statsSection || "#FFFFFF" }}
        >
          <div className="text-center">
            <p className="text-xl font-black" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{profileData?.totalIdeasPosted || 0}</p>
            <p className="text-[10px] uppercase font-black opacity-50" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Ideas</p>
          </div>
          <div className="text-center border-x border-border/50">
            <p className="text-xl font-black" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{(profileData?.totalViewsReceived || 0).toLocaleString()}</p>
            <p className="text-[10px] uppercase font-black opacity-50" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Views</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{(profileData?.totalIdeasSaved || 0).toLocaleString()}</p>
            <p className="text-[10px] uppercase font-black opacity-50" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Saves</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-ideas" className="w-full relative z-10">
        <div 
          onClick={(e) => handleZoneClick(e, 'tabsList')}
          className={cn(
            "transition-colors duration-300 border-b",
            isPaintMode ? "cursor-crosshair" : "cursor-pointer"
          )}
          style={{ backgroundColor: formData.customColors.tabsList }}
        >
          <TabsList className={cn("w-full bg-transparent border-none rounded-none px-6 h-14", isPaintMode && "pointer-events-none")}>
            <TabsTrigger value="my-ideas" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent" style={{ color: getContrastColor(formData.customColors.tabsList) }}>
              <Grid size={22} />
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent" style={{ color: getContrastColor(formData.customColors.tabsList) }}>
              <Bookmark size={22} />
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent" style={{ color: getContrastColor(formData.customColors.tabsList) }}>
              <Heart size={22} />
            </TabsTrigger>
          </TabsList>
        </div>

        <div 
          onClick={(e) => handleZoneClick(e, 'tabsContent')}
          className={cn(
            "min-h-[300px] transition-colors duration-300 pb-20",
            isPaintMode ? "cursor-crosshair" : "cursor-pointer"
          )}
          style={{ backgroundColor: formData.customColors.tabsContent }}
        >
          <TabsContent value="my-ideas" className="px-1 mt-0">
            <div className="grid grid-cols-3 gap-1">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="aspect-square relative overflow-hidden group">
                  <Image src={`https://picsum.photos/seed/idea${user.uid}${i}/400/400`} alt="idea" fill className="object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="saved" className="flex items-center justify-center py-20 opacity-30">
            <Bookmark size={40} style={{ color: getContrastColor(formData.customColors.tabsContent) }} />
          </TabsContent>
          <TabsContent value="liked" className="flex items-center justify-center py-20 opacity-30">
            <Heart size={40} style={{ color: getContrastColor(formData.customColors.tabsContent) }} />
          </TabsContent>
        </div>
      </Tabs>

      <div className="absolute inset-0 pointer-events-none z-[30]">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id}
            onPointerDown={(e) => handleStickerPointerDown(e, sticker.id)}
            onPointerMove={(e) => handleStickerPointerMove(e, sticker.id)}
            onPointerUp={(e) => handleStickerPointerUp(e, sticker.id)}
            className={cn(
              "absolute pointer-events-auto",
              activeStickerId === sticker.id && !isPaintMode ? "cursor-grab active:cursor-grabbing ring-2 ring-primary ring-offset-2 rounded-xl" : "",
            )}
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`,
              touchAction: 'none'
            }}
          >
            <div className="relative w-24 h-24">
              <Image 
                src={sticker.url} 
                alt="sticker" 
                fill 
                className="object-contain" 
                draggable={false} 
                unoptimized={sticker.url.startsWith('data:')}
              />
            </div>
          </div>
        ))}
      </div>

      {activeStickerId && !isPaintMode && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[310] w-[90%] max-w-[340px] bg-white rounded-3xl shadow-2xl border border-primary/20 p-4 space-y-4 animate-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary">Edit Sticker</span>
             <div className="flex gap-2">
                <button className="h-8 w-8 rounded-full text-destructive flex items-center justify-center hover:bg-destructive/10" onClick={() => {
                   const updated = formData.stickers.filter(s => s.id !== activeStickerId);
                   setFormData(prev => ({ ...prev, stickers: updated }));
                   saveToFirestore({ stickers: updated });
                   setActiveStickerId(null);
                }}><Trash2 size={16} /></button>
                <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted" onClick={() => setActiveStickerId(null)}><X size={16} /></button>
             </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <RotateCw size={14} className="text-muted-foreground shrink-0" />
                <Slider value={[formData.stickers.find(s => s.id === activeStickerId)?.rotation || 0]} max={360} onValueChange={([v]) => updateActiveSticker({ rotation: v })} />
              </div>
              <div className="flex items-center gap-4">
                <Maximize size={14} className="text-muted-foreground shrink-0" />
                <Slider value={[(formData.stickers.find(s => s.id === activeStickerId)?.scale || 1) * 100]} min={50} max={200} onValueChange={([v]) => updateActiveSticker({ scale: v / 100 })} />
              </div>
            </div>
            <Button className="w-full h-10 rounded-2xl bg-primary text-white text-[10px] font-black uppercase" onClick={handleSaveProfile}>Lock Position</Button>
          </div>
        </div>
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto no-scrollbar border-none z-[600]">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase text-center">Customize Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Display Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                    className="rounded-2xl h-12 bg-muted/20 border-none" 
                    placeholder="Update your name..."
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Bio Description (Max 160)</Label>
                  <Textarea 
                    value={formData.bio} 
                    maxLength={160}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} 
                    placeholder="Tell your story..."
                    className="rounded-2xl bg-muted/20 border-none min-h-[100px]" 
                  />
               </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <PaintBucket size={12} /> Theme Painter
              </Label>
              <div className="flex flex-wrap gap-2 justify-center bg-muted/30 p-4 rounded-3xl">
                {PALETTE.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setActiveColor(color);
                      setIsPaintMode(true);
                      setIsEditModalOpen(false);
                      toast({ title: "Paint Mode Active", description: "Tap any section to paint it." });
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm",
                      activeColor === color ? "border-primary scale-110" : "border-white"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Banner Image</Label>
              <div onClick={() => bannerInputRef.current?.click()} className="relative h-24 bg-muted rounded-2xl overflow-hidden cursor-pointer border group">
                {formData.banner ? (
                  <Image 
                    src={formData.banner} 
                    alt="Banner" 
                    fill 
                    className="object-cover" 
                    style={{ objectPosition: `50% ${formData.bannerOffset}%` }}
                    unoptimized={formData.banner.startsWith('data:')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon /></div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase">Change Photo</div>
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            </div>

            <div className="flex items-center gap-4">
               <div className="relative w-20 h-20 rounded-full bg-muted overflow-hidden border">
                 <Image src={formData.profilePic || `https://picsum.photos/seed/${user.uid}/200/200`} alt="Profile" fill className="object-cover" />
                 <button onClick={() => profileInputRef.current?.click()} className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100"><Camera className="text-white" size={16} /></button>
               </div>
               <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Picture</p>
                  <Button variant="outline" size="sm" className="mt-1 rounded-full text-[9px] uppercase font-black" onClick={() => profileInputRef.current?.click()}>Update Photo</Button>
               </div>
               <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Sticker Collection</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-full h-12 w-12 border-2 border-dashed border-primary/20" onClick={() => stickerInputRef.current?.click()}><Plus size={20} /></Button>
                {formData.stickers.map(s => (
                  <div key={s.id} className="relative w-12 h-12 rounded-xl bg-muted border p-1 group">
                    <Image 
                      src={s.url} 
                      alt="sticker" 
                      fill 
                      className="object-contain p-1" 
                      unoptimized={s.url.startsWith('data:')}
                    />
                    <button onClick={() => { setActiveStickerId(s.id); setIsEditModalOpen(false); }} className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black text-white uppercase rounded-xl">Move</button>
                  </div>
                ))}
              </div>
              <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 mt-4">
            <Button className="flex-1 rounded-2xl h-12 uppercase font-black text-[10px] bg-primary text-white shadow-xl shadow-primary/10" onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save All Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

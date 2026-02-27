
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Camera, 
  Plus, RotateCw, Pencil, Loader2, 
  Tablet, ChevronLeft, PaintBucket,
  Check, Layout, Square, User, List, Layers,
  Minimize, Maximize, RotateCcw, Trash2, Video, Type, Image as LucideImage
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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

type ColorSection = keyof CustomColors;

const COLOR_CATEGORIES = {
  "Pastels": ["#FFFFFF", "#F8FAFC", "#F0FDF4", "#ECFDF5", "#EFF6FF", "#F5F3FF", "#FDF2F8", "#FFF7ED", "#FFFBEB", "#FEF2F2", "#ECFEFF", "#F5F5F5"],
  "Vibrant": ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1"],
  "Deep": ["#0F172A", "#18181B", "#171717", "#1C1917", "#450A0A", "#422006", "#3F2E0E", "#064E3B", "#134E4A", "#1E1B4B", "#312E81", "#4C1D95", "#581C87", "#701A75", "#831843", "#7F1D1D"]
};

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return 'inherit';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [draggedStickerId, setDraggedStickerId] = useState<string | null>(null);
  
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [tempBannerUrl, setTempBannerUrl] = useState<string | null>(null);
  const [bannerOffset, setBannerOffset] = useState(50);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  const [activeColorSection, setActiveColorSection] = useState<ColorSection | null>(null);

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

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: formData.name });
      
      await setDoc(profileRef, {
        id: user.uid,
        username: formData.name.toLowerCase().replace(/\s/g, ''),
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        bannerOffset: bannerOffset,
        stickers: formData.stickers,
        customColors: formData.customColors,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Profile Published", description: "Your custom theme is now live for everyone." });
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerDragMove = (e: React.PointerEvent) => {
    if (!isDraggingBanner) return;
    const deltaY = e.clientY - dragStartY;
    const newOffset = Math.max(0, Math.min(100, bannerOffset - (deltaY / 2.5)));
    setBannerOffset(newOffset);
    setDragStartY(e.clientY);
  };

  const handleBannerDragEnd = (e: React.PointerEvent) => {
    setIsDraggingBanner(false);
    try {
      const el = e.currentTarget as HTMLElement;
      if (el && el.releasePointerCapture) {
        el.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner' | 'sticker') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') {
        setFormData(prev => ({ ...prev, profilePic: base64 }));
      } else if (type === 'banner') {
        setTempBannerUrl(base64);
        setShowBannerEditor(true);
        setIsEditModalOpen(false);
      } else if (type === 'sticker') {
        const newSticker = { id: Math.random().toString(36).substr(2, 9), url: base64, x: 50, y: 50, rotation: 0, scale: 1 };
        setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
      }
    }
  };

  const applyColor = (hex: string) => {
    if (!activeColorSection) return;
    setFormData(prev => ({
      ...prev,
      customColors: {
        ...prev.customColors,
        [activeColorSection]: hex
      }
    }));
    setIsColorPickerOpen(false);
    setIsEditModalOpen(true); 
    setActiveColorSection(null);
  };

  const openPickerFor = (section: ColorSection) => {
    setActiveColorSection(section);
    setIsColorPickerOpen(true);
    setIsEditModalOpen(false);
  };

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const deleteSticker = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.filter(s => s.id !== id)
    }));
    setActiveStickerId(null);
  };

  if (isUserLoading || isProfileLoading) return <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (!user) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
    >
      {/* STICKER CONTROL BAR */}
      {activeStickerId && !isEditModalOpen && !showBannerEditor && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[4000] w-[90%] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-6">
          <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-5 shadow-2xl border border-primary/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-primary/20 active:scale-90" onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { scale: Math.max(0.2, s.scale - 0.1) });
                }}><Minimize size={18} /></Button>
              <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-primary/20 active:scale-90" onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { scale: Math.min(3, s.scale + 0.1) });
                }}><Maximize size={18} /></Button>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-primary/20 active:scale-90" onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { rotation: (s.rotation - 15) % 360 });
                }}><RotateCcw size={18} /></Button>
              <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-primary/20 active:scale-90" onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { rotation: (s.rotation + 15) % 360 });
                }}><RotateCw size={18} /></Button>
            </div>
            <div className="h-8 w-px bg-border" />
            <Button variant="destructive" size="icon" className="rounded-full h-11 w-11 shadow-lg shadow-destructive/20 active:scale-90" onClick={() => deleteSticker(activeStickerId)}><Trash2 size={18} /></Button>
          </div>
          <Button onClick={() => { setActiveStickerId(null); setIsEditModalOpen(true); }} className="rounded-[2rem] bg-primary text-white shadow-2xl h-14 font-black uppercase tracking-widest border-2 border-white/30 active:scale-95 transition-transform"><Check className="mr-2" /> Done Positioning</Button>
        </div>
      )}

      {/* BANNER EDITOR */}
      {showBannerEditor && (
        <div className="fixed inset-0 z-[2000] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-[2100]">
            <Button variant="ghost" size="icon" onClick={() => setShowBannerEditor(false)} className="rounded-full"><ChevronLeft size={24} /></Button>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary text-center flex-1">Position Banner</h2>
            <div className="w-10" />
          </header>
          <div className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest"><Tablet size={20} /> Preview</div>
              <div className="relative aspect-video w-full bg-slate-900 rounded-[3rem] overflow-hidden border-8 border-slate-800 shadow-2xl">
                <div 
                  className="h-full w-full relative cursor-grab active:cursor-grabbing touch-none flex flex-col overflow-hidden bg-slate-800"
                  onPointerDown={(e) => { 
                    setIsDraggingBanner(true); 
                    setDragStartY(e.clientY); 
                    try { (e.currentTarget as any).setPointerCapture(e.pointerId); } catch {}
                  }}
                  onPointerMove={handleBannerDragMove}
                  onPointerUp={handleBannerDragEnd}
                >
                  {tempBannerUrl && <Image src={tempBannerUrl} alt="Banner Preview" fill className="object-cover select-none pointer-events-none" style={{ objectPosition: `50% ${bannerOffset}%` }} unoptimized={true} />}
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                     <div className="bg-white/20 backdrop-blur-md rounded-full px-5 py-2 text-[9px] font-black uppercase text-white border border-white/30 shadow-lg tracking-widest">Drag up/down to align</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-8 pb-12">
               <Button onClick={() => { setFormData(prev => ({ ...prev, banner: tempBannerUrl!, bannerOffset })); setShowBannerEditor(false); setIsEditModalOpen(true); }} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30">Apply Placement</Button>
            </div>
          </div>
        </div>
      )}

      {/* SEAMLESS HEADER */}
      <div 
        className="px-6 flex justify-between items-center py-5 relative z-[100] transition-colors duration-300" 
        style={{ backgroundColor: formData.customColors.header }}
      >
        <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Sphere Profile</h1>
        <Button variant="ghost" size="icon" className="rounded-full active:scale-90 transition-transform" onClick={() => setIsSettingsOpen(true)}><Settings size={24} style={{ color: getContrastColor(formData.customColors.header) }} /></Button>
      </div>

      {/* SEAMLESS USER INFO */}
      <div 
        className="relative z-50 transition-colors duration-300" 
        style={{ backgroundColor: formData.customColors.userInfo }}
      >
        <div className="relative h-56 w-full bg-muted overflow-hidden">
          <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        </div>
        <div className="px-6 -mt-20 flex flex-col items-center relative z-10 pb-10">
          <Avatar className="h-36 w-36 border-4 border-white bg-white shadow-2xl transition-transform active:scale-105">
            <AvatarImage src={formData.profilePic} className="object-cover" />
            <AvatarFallback className="text-2xl font-black uppercase">{formData.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="text-center mt-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || user.displayName || "Innovator"}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(formData.customColors.userInfo) }}>Master of Innovations</p>
          </div>
          <div 
            className="p-8 rounded-[3rem] border w-full mt-8 shadow-xl transition-colors duration-300" 
            style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}
          >
            <p className="text-center text-[13px] leading-relaxed font-bold italic break-words overflow-hidden" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
              {formData.bio || "Building the future of shared intelligence in the sphere."}
            </p>
          </div>
        </div>
      </div>

      {/* SEAMLESS STATS SECTION */}
      <div 
        className="relative z-40 transition-colors duration-300 py-12 px-10" 
        style={{ backgroundColor: formData.customColors.statsSection }}
      >
        <div className="grid grid-cols-3 gap-8 w-full">
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{profileData?.totalIdeasPosted || 0}</p>
            <p className="text-[9px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Ideas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{(profileData?.totalViewsReceived || 0).toLocaleString()}</p>
            <p className="text-[9px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Views</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{(profileData?.totalIdeasSaved || 0).toLocaleString()}</p>
            <p className="text-[9px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Saves</p>
          </div>
        </div>
      </div>

      {/* SEAMLESS TABS SECTION */}
      <Tabs defaultValue="photo" className="w-full relative z-30">
        <div className="transition-colors duration-300" style={{ backgroundColor: formData.customColors.tabsList }}>
          <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-16">
            <TabsTrigger value="photo" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <LucideImage size={24} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Video size={24} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Type size={24} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="transition-colors duration-300 min-h-[400px] pb-32" style={{ backgroundColor: formData.customColors.tabsContent }}>
          <TabsContent value="photo" className="mt-0 py-20 text-center">
            <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>Empty Canvas</p>
          </TabsContent>
          <TabsContent value="video" className="mt-0 py-20 text-center">
            <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Screen Records</p>
          </TabsContent>
          <TabsContent value="text" className="mt-0 py-20 text-center">
            <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Typed Concepts</p>
          </TabsContent>
        </div>
      </Tabs>

      {/* STICKERS LAYER - PERSISTENT */}
      <div className="absolute inset-0 pointer-events-none z-[150]">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className={cn("absolute pointer-events-auto cursor-move", activeStickerId === sticker.id ? "ring-4 ring-primary ring-offset-4 rounded-2xl active-glow" : "")} 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, 
              touchAction: 'none' 
            }}
          >
            <div className="relative w-32 h-32" 
              onPointerDown={(e) => { 
                if (activeStickerId === sticker.id) { 
                  setDraggedStickerId(sticker.id); 
                  try { (e.currentTarget as any).setPointerCapture(e.pointerId); } catch {} 
                } 
              }} 
              onPointerMove={(e) => { 
                if (draggedStickerId === sticker.id) { 
                  const rect = containerRef.current!.getBoundingClientRect(); 
                  updateSticker(sticker.id, { 
                    x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)), 
                    y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)) 
                  });
                } 
              }} 
              onPointerUp={(e) => { setDraggedStickerId(null); try { (e.currentTarget as any).releasePointerCapture(e.pointerId); } catch {} }}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()} 
          className="max-w-md w-[95%] rounded-[3rem] p-7 max-h-[92vh] overflow-y-auto z-[3000] no-scrollbar border-none shadow-2xl flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="text-xs font-black uppercase text-center text-primary tracking-[0.2em] mb-4">Personalize Theme</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-2">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Banner Placement</Label>
                <div className="relative h-32 w-full rounded-[2rem] overflow-hidden border-2 border-muted bg-muted group cursor-pointer shadow-lg" onClick={() => bannerInputRef.current?.click()}>
                  <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="Banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                     <Camera size={24} className="mb-1" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-center">Update & Reposition</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <Label className="text-[10px] font-black uppercase tracking-widest">Brand Logo</Label>
                <div className="relative h-28 w-28 rounded-full border-4 border-white bg-white shadow-2xl group cursor-pointer overflow-hidden active:scale-95 transition-transform" onClick={() => profileInputRef.current?.click()}>
                  <Image src={formData.profilePic} alt="Logo" fill className="object-cover" unoptimized={true} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={24} /></div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Innovator Handle</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-2xl h-14 bg-muted/30 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Mission Brief</Label>
                <Textarea value={formData.bio} maxLength={160} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl min-h-[100px] bg-muted/30 border-none font-medium leading-relaxed" />
              </div>
            </div>

            <div className="space-y-5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2 text-primary"><PaintBucket size={16} /> Surface Themes</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 border-muted shadow-sm" onClick={() => openPickerFor('header')}>
                  <Layout size={18} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Header</span>
                  <div className="w-10 h-1.5 rounded-full border shadow-inner" style={{ backgroundColor: formData.customColors.header || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-16 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 border-muted shadow-sm" onClick={() => openPickerFor('background')}>
                  <Square size={18} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Canvas</span>
                  <div className="w-10 h-1.5 rounded-full border shadow-inner" style={{ backgroundColor: formData.customColors.background || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-16 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 border-muted shadow-sm" onClick={() => openPickerFor('userInfo')}>
                  <User size={18} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Profile Box</span>
                  <div className="w-10 h-1.5 rounded-full border shadow-inner" style={{ backgroundColor: formData.customColors.userInfo || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-16 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 border-muted shadow-sm" onClick={() => openPickerFor('bioCard')}>
                  <Pencil size={18} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Bio Area</span>
                  <div className="w-10 h-1.5 rounded-full border shadow-inner" style={{ backgroundColor: formData.customColors.bioCard || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-16 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 border-muted shadow-sm" onClick={() => openPickerFor('statsSection')}>
                  <Plus size={18} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Impact Hub</span>
                  <div className="w-10 h-1.5 rounded-full border shadow-inner" style={{ backgroundColor: formData.customColors.statsSection || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-16 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 border-muted shadow-sm" onClick={() => openPickerFor('tabsList')}>
                  <List size={18} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Tab Bar</span>
                  <div className="w-10 h-1.5 rounded-full border shadow-inner" style={{ backgroundColor: formData.customColors.tabsList || '#F3F4F6' }} />
                </Button>
              </div>
            </div>

            <div className="space-y-4 pb-4">
               <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Innovation Stickers</Label>
               <Button variant="outline" className="w-full h-14 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] border-primary/30 text-primary bg-primary/5 active:scale-95 transition-transform" onClick={() => stickerInputRef.current?.click()}><Plus size={18} /> Add New Sticker</Button>
               <div className="flex flex-wrap gap-3 pt-2">
                 {formData.stickers.map(s => (
                   <button 
                    key={s.id} 
                    onClick={() => { setActiveStickerId(s.id); setIsEditModalOpen(false); }} 
                    className={cn(
                      "w-16 h-16 border-2 rounded-2xl p-2 relative active:scale-90 transition-all", 
                      activeStickerId === s.id ? "border-primary bg-primary/10 shadow-xl" : "border-muted bg-white"
                    )}
                   >
                     <Image src={s.url} alt="sticker" width={64} height={64} className="object-contain" unoptimized={true}/>
                   </button>
                 ))}
               </div>
            </div>
            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
          </div>
          <DialogFooter className="mt-6 pt-5 border-t">
            <Button className="w-full h-16 rounded-[2.5rem] bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30 active:scale-95 transition-transform" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Publish Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COLOR PICKER SHEET */}
      <Sheet open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-[3.5rem] p-8 max-h-[75vh] overflow-y-auto no-scrollbar border-none z-[4100] shadow-2xl">
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-primary mb-8">Surface Palette</SheetTitle></SheetHeader>
          <div className="space-y-10 pb-20">
            {Object.entries(COLOR_CATEGORIES).map(([category, colors]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">{category}</h3>
                <div className="grid grid-cols-6 gap-4">
                  {colors.map(c => (
                    <button 
                      key={c} 
                      onClick={() => applyColor(c)} 
                      className={cn(
                        "aspect-square rounded-full border-2 transition-all active:scale-75 shadow-sm", 
                        formData.customColors[activeColorSection!] === c ? "border-primary scale-125 shadow-xl z-10" : "border-white"
                      )} 
                      style={{ backgroundColor: c }} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* SETTINGS SHEET */}
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-[3.5rem] p-8 border-none z-[4100] shadow-2xl">
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-center mb-6">Management Hub</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            <Button 
              variant="outline" 
              className="w-full justify-start h-16 rounded-[2rem] px-8 gap-5 border-primary/30 text-primary font-black uppercase tracking-widest shadow-md hover:bg-primary/5 active:scale-95 transition-all" 
              onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}
            >
              <Pencil size={20} /> Edit Profile Theme
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSignOut} 
              className="w-full justify-start h-16 rounded-[2rem] px-8 gap-5 text-secondary font-black uppercase tracking-widest hover:bg-secondary/10 active:scale-95 transition-all"
            >
              <LogOut size={20} /> Terminate Session
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

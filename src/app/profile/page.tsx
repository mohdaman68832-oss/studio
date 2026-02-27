
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, Grid, Bookmark, Heart, LogOut, Camera, 
  Image as ImageIcon, Plus, RotateCw, Pencil, Loader2, 
  Tablet, ChevronLeft, PaintBucket,
  X, Palette, Check, Layout, Square, User, List, Layers,
  Move, Maximize, Minimize, RotateCcw, Trash2, Video, Type, Image as LucideImage
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
import { doc, updateDoc } from "firebase/firestore";
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
  "Light (Pastels)": ["#FFFFFF", "#F8FAFC", "#F0FDF4", "#ECFDF5", "#EFF6FF", "#F5F3FF", "#FDF2F8", "#FFF7ED", "#FFFBEB", "#FEF2F2", "#ECFEFF", "#F5F5F5"],
  "Vibrant": ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1"],
  "Dark & Deep": ["#0F172A", "#18181B", "#171717", "#1C1917", "#450A0A", "#422006", "#3F2E0E", "#064E3B", "#134E4A", "#1E1B4B", "#312E81", "#4C1D95", "#581C87", "#701A75", "#831843", "#7F1D1D"]
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
      
      await updateDoc(profileRef, {
        username: formData.name,
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        bannerOffset: formData.bannerOffset,
        stickers: formData.stickers,
        customColors: formData.customColors,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Success", description: "Profile updated!" });
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
    setIsEditModalOpen(false); 
    setActiveColorSection(null);
  };

  const openPickerFor = (section: ColorSection) => {
    setActiveColorSection(section);
    setIsColorPickerOpen(true);
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

  if (isUserLoading || isProfileLoading) return <div className="max-w-md mx-auto p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;
  if (!user) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
    >
      {/* STICKER CONTROL BAR */}
      {activeStickerId && !isEditModalOpen && !showBannerEditor && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[4000] w-[90%] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-primary/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-primary/30"
                onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { scale: Math.max(0.2, s.scale - 0.1) });
                }}
              >
                <Minimize size={18} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-primary/30"
                onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { scale: Math.min(3, s.scale + 0.1) });
                }}
              >
                <Maximize size={18} />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-primary/30"
                onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { rotation: (s.rotation - 15) % 360 });
                }}
              >
                <RotateCcw size={18} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-primary/30"
                onClick={() => {
                  const s = formData.stickers.find(st => st.id === activeStickerId);
                  if (s) updateSticker(activeStickerId, { rotation: (s.rotation + 15) % 360 });
                }}
              >
                <RotateCw size={18} />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full h-10 w-10"
              onClick={() => deleteSticker(activeStickerId)}
            >
              <Trash2 size={18} />
            </Button>
          </div>

          <Button 
            onClick={() => { setActiveStickerId(null); setIsEditModalOpen(true); }}
            className="rounded-full bg-primary text-white shadow-2xl h-14 font-black uppercase tracking-widest border-2 border-white/20 active:scale-95 transition-transform"
          >
            <Check className="mr-2" /> Done Positioning
          </Button>
        </div>
      )}

      {/* BANNER REPOSITION OVERLAY */}
      {showBannerEditor && (
        <div className="fixed inset-0 z-[2000] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-50">
            <Button variant="ghost" size="icon" onClick={() => setShowBannerEditor(false)} className="rounded-full"><ChevronLeft size={24} /></Button>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Reposition Banner</h2>
            <div className="w-10" />
          </header>
          
          <div className="flex-1 p-6 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Tablet size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Device Preview</span>
              </div>
              <div className="relative aspect-[4/3] w-full bg-slate-900 rounded-[3rem] overflow-hidden border-8 border-slate-800 shadow-2xl">
                <div 
                  className="h-full w-full relative cursor-grab active:cursor-grabbing touch-none flex flex-col rounded-[2.2rem] overflow-hidden bg-slate-800"
                  onPointerDown={(e) => { 
                    setIsDraggingBanner(true); 
                    setDragStartY(e.clientY); 
                    try { (e.currentTarget as any).setPointerCapture(e.pointerId); } catch {}
                  }}
                  onPointerMove={handleBannerDragMove}
                  onPointerUp={handleBannerDragEnd}
                >
                  {tempBannerUrl && (
                    <Image 
                      src={tempBannerUrl} 
                      alt="Banner Preview" 
                      fill 
                      className="object-cover select-none pointer-events-none" 
                      style={{ objectPosition: `50% ${bannerOffset}%` }} 
                      unoptimized={true} 
                    />
                  )}
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                     <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1 text-[8px] font-black uppercase text-white border border-white/30 shadow-lg">Drag Image to Reposition</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-4">
               <Button onClick={() => { setFormData(prev => ({ ...prev, banner: tempBannerUrl!, bannerOffset })); setShowBannerEditor(false); setIsEditModalOpen(true); }} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl">Apply Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE SECTIONS */}
      <div className="flex flex-col">
        {/* HEADER BAR */}
        <div 
          className="px-6 flex justify-between items-center py-4 relative z-20 transition-colors duration-300" 
          style={{ backgroundColor: formData.customColors.header }}
        >
          <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Profile</h1>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSettingsOpen(true)}><Settings size={22} style={{ color: getContrastColor(formData.customColors.header) }} /></Button>
        </div>

        {/* USER INFO AREA */}
        <div 
          className="relative z-10 transition-colors duration-300 pb-8" 
          style={{ backgroundColor: formData.customColors.userInfo }}
        >
          <div className="relative h-48 w-full bg-muted overflow-hidden">
            <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center relative z-10">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-lg">
              <AvatarImage src={formData.profilePic} className="object-cover" />
              <AvatarFallback className="text-2xl font-black">{formData.name?.[0] || user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || user.displayName || "Innovator"}</h2>
            </div>
            
            {/* BIO BOX */}
            <div 
              className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-sm transition-colors duration-300" 
              style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}
            >
              <p className="text-center text-xs leading-relaxed font-medium italic break-words overflow-hidden" style={{ color: getContrastColor(formData.customColors.bioCard) }}>{formData.bio || "Crafting new ideas daily in the sphere."}</p>
            </div>
          </div>
        </div>

        {/* STATS SECTION */}
        <div 
          className="relative z-10 transition-colors duration-300 py-8 px-10 border-y border-border/10" 
          style={{ backgroundColor: formData.customColors.statsSection }}
        >
          <div className="grid grid-cols-3 gap-8 w-full">
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

        {/* TABS AREA */}
        <Tabs defaultValue="photo" className="w-full relative z-10">
          <div 
            className="transition-colors duration-300" 
            style={{ backgroundColor: formData.customColors.tabsList }}
          >
            <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-14">
              <TabsTrigger value="photo" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                <LucideImage size={22} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
              </TabsTrigger>
              <TabsTrigger value="video" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                <Video size={22} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                <Type size={22} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* CONTENT AREA */}
          <div 
            className="transition-colors duration-300 min-h-[300px]" 
            style={{ backgroundColor: formData.customColors.tabsContent }}
          >
            <TabsContent value="photo" className="mt-0 px-1 py-12 text-center pb-32">
              <p className="opacity-30 text-[10px] font-black uppercase tracking-widest" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>
                Photo Posts Will Appear Here
              </p>
            </TabsContent>
            <TabsContent value="video" className="mt-0 px-1 py-12 text-center pb-32">
              <p className="opacity-30 text-[10px] font-black uppercase tracking-widest" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>
                Video Posts Will Appear Here
              </p>
            </TabsContent>
            <TabsContent value="text" className="mt-0 px-1 py-12 text-center pb-32">
              <p className="opacity-30 text-[10px] font-black uppercase tracking-widest" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>
                Text Posts Will Appear Here
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* STICKERS LAYER */}
      <div className="absolute inset-0 pointer-events-none z-[30]">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className={cn(
              "absolute pointer-events-auto cursor-move", 
              activeStickerId === sticker.id ? "ring-4 ring-primary ring-offset-4 rounded-xl active-glow" : ""
            )} 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, 
              touchAction: 'none' 
            }}
          >
            <div className="relative w-28 h-28" 
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
              onPointerUp={(e) => { 
                setDraggedStickerId(null); 
                try { (e.currentTarget as any).releasePointerCapture(e.pointerId); } catch {} 
              }}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      {/* EDIT PROFILE MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-md w-[95%] rounded-[3rem] p-6 max-h-[90vh] overflow-y-auto z-[3000] no-scrollbar border-none shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase text-center text-primary tracking-[0.2em]">Optimize Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-4">
            {/* PREVIEWS - BANNER ON TOP, LOGO BELOW */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Banner Area</Label>
                <div 
                  className="relative h-28 w-full rounded-2xl overflow-hidden border-2 border-muted bg-muted group cursor-pointer shadow-sm"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="Banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase text-center px-4">Tap to Change & Position Banner</div>
                </div>
              </div>

              <div className="space-y-2 flex flex-col items-center">
                <Label className="text-[10px] font-black uppercase tracking-widest">Logo / Profile Pic</Label>
                <div 
                  className="relative h-24 w-24 rounded-full border-4 border-white bg-white shadow-lg group cursor-pointer overflow-hidden"
                  onClick={() => profileInputRef.current?.click()}
                >
                  <Image src={formData.profilePic} alt="Logo" fill className="object-cover" unoptimized={true} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={20} /></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Display Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-2xl h-12 bg-muted/20 border-none" placeholder="Your Name"/>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Bio (max 160 chars)</Label>
                <Textarea value={formData.bio} maxLength={160} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl min-h-[80px] bg-muted/20 border-none break-all" placeholder="Share your journey..."/>
              </div>
            </div>
            
            {/* SURGICAL COLOR CONTROLS */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                <PaintBucket size={14} className="text-primary" /> Surface Themes
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('header')}>
                  <Layout size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase">Header bar</span>
                  <div className="w-8 h-1 rounded-full" style={{ backgroundColor: formData.customColors.header || 'transparent' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('background')}>
                  <Square size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase">Main Canvas</span>
                  <div className="w-8 h-1 rounded-full" style={{ backgroundColor: formData.customColors.background || 'transparent' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('userInfo')}>
                  <User size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase">Profile Area</span>
                  <div className="w-8 h-1 rounded-full" style={{ backgroundColor: formData.customColors.userInfo || 'transparent' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('bioCard')}>
                  <Pencil size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase">Bio Box</span>
                  <div className="w-8 h-1 rounded-full" style={{ backgroundColor: formData.customColors.bioCard || 'transparent' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('statsSection')}>
                  <Plus size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase">Stats Box</span>
                  <div className="w-8 h-1 rounded-full" style={{ backgroundColor: formData.customColors.statsSection || 'transparent' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('tabsList')}>
                  <List size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase">Tabs Line</span>
                  <div className="w-8 h-1 rounded-full" style={{ backgroundColor: formData.customColors.tabsList || 'transparent' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('tabsContent')}>
                  <Layers size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black uppercase">Posts Area</span>
                  <div className="w-8 h-1 rounded-full" style={{ backgroundColor: formData.customColors.tabsContent || 'transparent' }} />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Decals (Stickers)</Label>
               <Button variant="outline" className="w-full h-12 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] border-primary/20 text-primary bg-primary/5" onClick={() => stickerInputRef.current?.click()}><Plus size={16} /> Add Sticker</Button>
               {formData.stickers.length > 0 && (
                 <div className="flex flex-wrap gap-2 pt-2">
                   {formData.stickers.map(s => (
                     <button 
                       key={s.id} 
                       onClick={() => { setActiveStickerId(s.id); setIsEditModalOpen(false); }} 
                       className={cn(
                         "w-14 h-14 border-2 rounded-2xl p-1 relative transition-all active:scale-95", 
                         activeStickerId === s.id ? "border-primary bg-primary/10 shadow-lg" : "border-muted"
                       )}
                     >
                       <Image src={s.url} alt="sticker" width={48} height={48} className="object-contain" unoptimized={true}/>
                       {activeStickerId === s.id && <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5"><Move size={10} /></div>}
                     </button>
                   ))}
                 </div>
               )}
            </div>

            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Publish Profile Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* THEME GALLERY */}
      <Sheet open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-6 max-h-[70vh] overflow-y-auto no-scrollbar border-none z-[4000]">
          <SheetHeader>
            <SheetTitle className="text-xs font-black uppercase tracking-widest text-center text-primary">
              Choose Color for {activeColorSection ? activeColorSection.toUpperCase() : 'Section'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-8 mt-6 pb-20">
            {Object.entries(COLOR_CATEGORIES).map(([category, colors]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{category}</h3>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map(c => (
                    <button 
                      key={c} 
                      onClick={() => applyColor(c)} 
                      className={cn(
                        "aspect-square rounded-full border-2 transition-all active:scale-90",
                        formData.customColors[activeColorSection!] === c ? "border-primary scale-110" : "border-white"
                      )} 
                      style={{ backgroundColor: c }} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md p-4 flex justify-center border-t">
            <Button variant="ghost" className="font-black uppercase text-[10px]" onClick={() => setIsColorPickerOpen(false)}>Cancel Selection</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* SETTINGS SHEET */}
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-6 border-none z-[4000]">
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-widest text-center">Settings</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-8">
            <Button variant="outline" className="w-full justify-start h-14 rounded-2xl px-6 gap-4 border-primary/20 text-primary font-black uppercase tracking-widest" onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}><Pencil size={18} /> Edit Sphere Profile</Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-14 rounded-2xl px-6 gap-4 text-secondary font-black uppercase tracking-widest hover:bg-secondary/10"><LogOut size={18} /> Sign Out</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

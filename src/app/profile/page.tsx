
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Camera, 
  Plus, Pencil, Loader2, 
  PaintBucket,
  Image as LucideImage, Video, Type,
  X
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
import { doc, setDoc } from "firebase/firestore";
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
        bannerOffset: formData.bannerOffset,
        stickers: formData.stickers,
        customColors: formData.customColors,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Profile Published", description: "Your custom theme is now live." });
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
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
        const newSticker = { id: Math.random().toString(36).substr(2, 9), url: base64, x: 50, y: 50, rotation: 0, scale: 1 };
        setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
      }
    }
  };

  const applyColor = (hex: string) => {
    if (!activeColorSection) return;
    setFormData(prev => ({ ...prev, customColors: { ...prev.customColors, [activeColorSection]: hex } }));
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

  if (isUserLoading || isProfileLoading) return <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (!user) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden flex flex-col m-0 p-0"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
    >
      {/* Stickers Layer - Above Background but Below Content */}
      <div className="absolute inset-0 pointer-events-none z-[15]">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className={cn("absolute pointer-events-auto cursor-move", activeStickerId === sticker.id ? "ring-2 ring-primary rounded-xl" : "")} 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, 
              touchAction: 'none' 
            }}
          >
            <div className="relative w-24 h-24" 
              onPointerDown={(e) => { if (activeStickerId === sticker.id) { setDraggedStickerId(sticker.id); (e.currentTarget as any).setPointerCapture(e.pointerId); } }} 
              onPointerMove={(e) => { 
                if (draggedStickerId === sticker.id) { 
                  const rect = containerRef.current!.getBoundingClientRect(); 
                  updateSticker(sticker.id, { 
                    x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)), 
                    y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)) 
                  });
                } 
              }} 
              onPointerUp={(e) => { setDraggedStickerId(null); (e.currentTarget as any).releasePointerCapture(e.pointerId); }}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col m-0 p-0 relative z-[20]">
        <div className="px-6 flex justify-between items-center py-5 m-0" style={{ backgroundColor: formData.customColors.header }}>
          <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Sphere Profile</h1>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSettingsOpen(true)}><Settings size={24} style={{ color: getContrastColor(formData.customColors.header) }} /></Button>
        </div>

        <div className="m-0" style={{ backgroundColor: formData.customColors.userInfo }}>
          <div className="relative h-56 w-full bg-muted overflow-hidden">
            <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
          </div>
          <div className="px-6 -mt-20 flex flex-col items-center relative z-[21] pb-10">
            <Avatar className="h-36 w-36 border-4 border-white bg-white shadow-2xl">
              <AvatarImage src={formData.profilePic} className="object-cover" />
              <AvatarFallback className="text-2xl font-black uppercase">{formData.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center mt-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || user.displayName || "Innovator"}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(formData.customColors.userInfo) }}>Master of Innovations</p>
            </div>
            <div className="p-8 rounded-[3rem] border w-full mt-8 shadow-xl relative z-[22]" style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}>
              <p className="text-center text-[13px] leading-relaxed font-bold italic" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
                {formData.bio || "Building the future of shared intelligence in the sphere."}
              </p>
            </div>
          </div>
        </div>

        <div className="py-12 px-10 m-0" style={{ backgroundColor: formData.customColors.statsSection }}>
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

        <Tabs defaultValue="photo" className="w-full m-0">
          <div style={{ backgroundColor: formData.customColors.tabsList }} className="m-0 p-0">
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
          <div className="min-h-[400px] pb-32 m-0" style={{ backgroundColor: formData.customColors.tabsContent }}>
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
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-md w-[95%] rounded-[3rem] p-7 max-h-[90vh] overflow-y-auto z-[3000] no-scrollbar border-none shadow-2xl flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="text-xs font-black uppercase text-center text-primary tracking-[0.2em] mb-4">Personalize Theme</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Banner Placement</Label>
                <div className="relative h-32 w-full rounded-[2rem] overflow-hidden border-2 border-muted bg-muted group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                  <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="Banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={24} /></div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Brand Logo</Label>
                <div className="relative h-24 w-24 rounded-full border-4 border-white bg-white shadow-xl group cursor-pointer overflow-hidden" onClick={() => profileInputRef.current?.click()}>
                  <Image src={formData.profilePic} alt="Logo" fill className="object-cover" unoptimized={true} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={24} /></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Innovator Handle</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-2xl h-12 bg-muted/30 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Mission Brief</Label>
                <Textarea value={formData.bio} maxLength={160} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl min-h-[80px] bg-muted/30 border-none font-medium" />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2 text-primary"><PaintBucket size={16} /> Surface Themes</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('header')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Header</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.header || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('background')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Canvas</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.background || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('userInfo')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Profile Box</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.userInfo || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('bioCard')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Bio Area</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.bioCard || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('statsSection')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Impact Hub</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.statsSection || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('tabsList')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Tab Bar</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.tabsList || '#F3F4F6' }} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Stickers</Label>
               <Button variant="outline" className="w-full h-12 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px]" onClick={() => stickerInputRef.current?.click()}><Plus size={18} /> Add New Sticker</Button>
               <div className="flex flex-wrap gap-2">
                 {formData.stickers.map(s => (
                   <button key={s.id} onClick={() => { setActiveStickerId(s.id); setIsEditModalOpen(false); }} className={cn("w-12 h-12 border rounded-xl p-1", activeStickerId === s.id ? "border-primary bg-primary/10" : "border-muted")}>
                     <Image src={s.url} alt="sticker" width={48} height={48} className="object-contain" unoptimized={true}/>
                   </button>
                 ))}
               </div>
            </div>
            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button className="w-full h-14 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest shadow-xl" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Publish Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-8 max-h-[70vh] overflow-y-auto no-scrollbar border-none z-[4100]">
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-primary mb-6">Surface Palette</SheetTitle></SheetHeader>
          <div className="space-y-8 pb-10">
            {Object.entries(COLOR_CATEGORIES).map(([category, colors]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">{category}</h3>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map(c => (
                    <button key={c} onClick={() => applyColor(c)} className={cn("aspect-square rounded-full border-2 transition-all active:scale-75", formData.customColors[activeColorSection!] === c ? "border-primary scale-110" : "border-white")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-8 border-none z-[4100]">
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-widest text-center mb-4">Management Hub</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Button variant="outline" className="w-full justify-start h-14 rounded-2xl px-6 gap-4 border-primary/20 text-primary font-black uppercase tracking-widest" onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}><Pencil size={18} /> Edit Theme</Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-14 rounded-2xl px-6 gap-4 text-secondary font-black uppercase tracking-widest hover:bg-secondary/10"><LogOut size={18} /> Sign Out</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

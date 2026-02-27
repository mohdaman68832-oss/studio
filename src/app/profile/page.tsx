
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Camera, 
  Loader2, 
  PaintBucket,
  Image as LucideImage, Video, Type,
  X,
  Plus,
  Monitor,
  Smartphone
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

      toast({ title: "Profile Optimized", description: "All changes saved successfully." });
      setIsOptimizeModalOpen(false);
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
    setActiveColorSection(null);
  };

  const openPickerFor = (section: ColorSection) => {
    setActiveColorSection(section);
    setIsColorPickerOpen(true);
  };

  if (isUserLoading || isProfileLoading) return <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (!user) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-hidden flex flex-col m-0 p-0 no-scrollbar"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
    >
      {/* Layer 0: Background Sections - Seamlessly Tiled */}
      <div className="flex flex-col m-0 p-0 relative z-0 shrink-0">
         <div className="h-16 w-full" style={{ backgroundColor: formData.customColors.header }} />
         <div className="h-[28rem] w-full" style={{ backgroundColor: formData.customColors.userInfo }} />
         <div className="h-28 w-full" style={{ backgroundColor: formData.customColors.statsSection }} />
         <div className="flex-1 w-full min-h-[50vh]" style={{ backgroundColor: formData.customColors.tabsContent }} />
      </div>

      {/* Layer 1: Stickers (z-index 10) - Behind main UI content */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className="absolute" 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, 
            }}
          >
            <div className="relative w-24 h-24 select-none">
              <Image src={sticker.url} alt="sticker" fill className="object-contain pointer-events-none" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      {/* Layer 2: UI Content (z-index 20) - Always ABOVE stickers */}
      <div className="absolute inset-0 flex flex-col m-0 p-0 z-20 pointer-events-none no-scrollbar overflow-y-auto">
        <div className="px-6 flex justify-between items-center py-5 pointer-events-auto">
          <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Sphere Profile</h1>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsOptimizeModalOpen(true)}>
            <Settings size={24} style={{ color: getContrastColor(formData.customColors.header) }} />
          </Button>
        </div>

        <div className="relative">
          <div className="relative h-52 w-full bg-muted overflow-hidden">
            <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center pb-4">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-2xl pointer-events-auto">
              <AvatarImage src={formData.profilePic} className="object-cover" />
              <AvatarFallback className="text-2xl font-black uppercase">{formData.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || user.displayName || "Innovator"}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(formData.customColors.userInfo) }}>Master Innovator</p>
            </div>
            <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-xl pointer-events-auto" style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}>
              <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
                {formData.bio || "Building the future of shared intelligence in the sphere."}
              </p>
            </div>
          </div>
        </div>

        <div className="py-8 px-10">
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{profileData?.totalIdeasPosted || 0}</p>
              <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Ideas</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{(profileData?.totalViewsReceived || 0).toLocaleString()}</p>
              <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Views</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{(profileData?.totalIdeasSaved || 0).toLocaleString()}</p>
              <p className="text-[8px] uppercase font-black opacity-40 tracking-widest" style={{ color: getContrastColor(formData.customColors.statsSection) }}>Saves</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="photo" className="w-full pointer-events-auto">
          <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-14">
            <TabsTrigger value="photo" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <LucideImage size={20} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Video size={20} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Type size={20} style={{ color: getContrastColor(formData.customColors.tabsList) }} />
            </TabsTrigger>
          </TabsList>
          <div className="min-h-[300px] pb-32">
            <TabsContent value="photo" className="mt-0 py-16 text-center">
              <p className="opacity-20 text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>Empty Canvas</p>
            </TabsContent>
            <TabsContent value="video" className="mt-0 py-16 text-center">
              <p className="opacity-20 text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Records</p>
            </TabsContent>
            <TabsContent value="text" className="mt-0 py-16 text-center">
              <p className="opacity-20 text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Concepts</p>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Hidden Inputs for Optimize Page */}
      <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
      <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />

      {/* COMPREHENSIVE OPTIMIZE PROFILE MODAL */}
      <Dialog open={isOptimizeModalOpen} onOpenChange={setIsOptimizeModalOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-md w-[95%] rounded-[3rem] p-0 overflow-hidden z-[2000] border-none shadow-2xl max-h-[85vh] flex flex-col"
        >
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Optimize Profile</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {/* 1. Banner Preview (On Top) */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><LucideImage size={14} /> Banner & Preview</Label>
               <div className="space-y-6">
                 <div className="relative h-32 bg-muted rounded-[2rem] overflow-hidden border-2 border-dashed border-primary/20 group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                   {formData.banner ? <Image src={formData.banner} alt="banner" fill className="object-cover" unoptimized={true} /> : <div className="w-full h-full flex flex-col items-center justify-center gap-1"><Camera className="text-muted-foreground/40" /><span className="text-[9px] font-black uppercase opacity-40">Tap to Upload Banner</span></div>}
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><Camera size={24} /></div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <p className="text-[8px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Monitor size={10} /> Desktop Preview</p>
                     <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted">
                        <Image src={formData.banner || `https://picsum.photos/seed/banner/800/400`} alt="Desktop" fill className="object-cover" unoptimized={true} />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <p className="text-[8px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Smartphone size={10} /> Mobile Preview</p>
                     <div className="flex justify-center">
                        <div className="relative w-full max-w-[80px] aspect-[4/3] rounded-xl overflow-hidden border bg-muted">
                          <Image src={formData.banner || `https://picsum.photos/seed/banner/800/400`} alt="Mobile" fill className="object-cover" unoptimized={true} />
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* 2. Logo & Branding (Below Banner) */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Camera size={14} /> Logo & Identity</Label>
               <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-full bg-muted border-4 border-white shadow-xl overflow-hidden group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                    <Avatar className="h-full w-full"><AvatarImage src={formData.profilePic} className="object-cover" /><AvatarFallback className="font-black">{formData.name?.[0]}</AvatarFallback></Avatar>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><Camera size={16} /></div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Display Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-xl h-10 bg-muted/30 border-none font-bold" placeholder="Innovator Name" />
                  </div>
               </div>
            </div>

            {/* 3. Bio & Expertise */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Type size={14} /> Personal Bio</Label>
              <Textarea 
                value={formData.bio} 
                maxLength={160} 
                onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} 
                className="rounded-[1.5rem] min-h-[80px] bg-muted/30 border-none font-medium text-xs p-4" 
                placeholder="Share your innovation journey..."
              />
            </div>

            {/* 4. Theme Colors (Seamless Pickers) */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><PaintBucket size={14} /> Color Scheme</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Header Strip', key: 'header' as const },
                  { label: 'Background', key: 'background' as const },
                  { label: 'User Area', key: 'userInfo' as const },
                  { label: 'Bio Box', key: 'bioCard' as const },
                  { label: 'Stats Strip', key: 'statsSection' as const },
                  { label: 'Tabs Bar', key: 'tabsList' as const }
                ].map(item => (
                  <Button key={item.key} variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted hover:border-primary/50 transition-all" onClick={() => openPickerFor(item.key)}>
                    <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
                    <div className="w-8 h-2 rounded-full border shadow-sm" style={{ backgroundColor: formData.customColors[item.key] || '#F3F4F6' }} />
                  </Button>
                ))}
              </div>
            </div>

            {/* 5. Sticker Management */}
            <div className="space-y-4 pb-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Plus size={14} /> Add Stickers</Label>
              <div className="bg-primary/5 p-6 rounded-[2rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:bg-primary/10 transition-all" onClick={() => stickerInputRef.current?.click()}>
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                   <Plus size={24} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Upload New Sticker</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t space-y-3 shrink-0">
             <Button className="w-full h-14 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" onClick={handleSaveProfile} disabled={isSaving}>
               {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Save Optimization"}
             </Button>
             <Button variant="ghost" className="w-full h-10 text-secondary font-black uppercase text-[9px] tracking-[0.2em]" onClick={handleSignOut}>
               <LogOut size={14} className="mr-2" /> Sign Out
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Picker Sheet (Nested) */}
      <Sheet open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-6 max-h-[60vh] overflow-y-auto no-scrollbar border-none z-[2100]">
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-widest text-center text-primary mb-6">Pick a Vibe</SheetTitle></SheetHeader>
          <div className="space-y-8 pb-12">
            {Object.entries(COLOR_CATEGORIES).map(([category, colors]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">{category}</h3>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map(c => (
                    <button key={c} onClick={() => applyColor(c)} className={cn("aspect-square rounded-full border-4 transition-all active:scale-90 shadow-sm", formData.customColors[activeColorSection!] === c ? "border-primary scale-110" : "border-white")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

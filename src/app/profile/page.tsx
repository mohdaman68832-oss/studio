
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Camera, 
  Plus, Pencil, Loader2, 
  PaintBucket,
  Image as LucideImage, Video, Type,
  X,
  Trash2,
  Maximize
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
        setActiveStickerId(newSticker.id);
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

  const removeSticker = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.filter(s => s.id !== id)
    }));
    setActiveStickerId(null);
  };

  if (isUserLoading || isProfileLoading) return <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (!user) return null;

  const activeSticker = formData.stickers.find(s => s.id === activeStickerId);

  return (
    <div 
      ref={containerRef}
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden flex flex-col m-0 p-0"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
    >
      {/* Background Seamless Layer - z-0 */}
      <div className="flex flex-col m-0 p-0 relative z-0">
         <div className="h-16 w-full" style={{ backgroundColor: formData.customColors.header }} />
         <div className="h-96 w-full" style={{ backgroundColor: formData.customColors.userInfo }} />
         <div className="h-32 w-full" style={{ backgroundColor: formData.customColors.statsSection }} />
         <div className="flex-1 w-full" style={{ backgroundColor: formData.customColors.tabsContent }} />
      </div>

      {/* Stickers Layer - Between Background and Content - z-10 */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className={cn(
              "absolute pointer-events-auto cursor-move transition-transform", 
              activeStickerId === sticker.id ? "ring-2 ring-primary ring-offset-4 rounded-xl" : ""
            )} 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, 
              touchAction: 'none',
              zIndex: activeStickerId === sticker.id ? 12 : 11
            }}
            onPointerDown={(e) => { 
                setActiveStickerId(sticker.id);
                setDraggedStickerId(sticker.id); 
                (e.currentTarget as any).setPointerCapture(e.pointerId); 
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
            onPointerUp={(e) => { setDraggedStickerId(null); (e.currentTarget as any).releasePointerCapture(e.pointerId); }}
          >
            <div className="relative w-24 h-24">
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
            {activeStickerId === sticker.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-lg z-50 pointer-events-auto"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* UI Content Layer - Above Everything - z-20 */}
      <div className="absolute inset-0 flex flex-col m-0 p-0 z-20 pointer-events-none">
        <div className="px-6 flex justify-between items-center py-5 pointer-events-auto">
          <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Sphere Profile</h1>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSettingsOpen(true)}><Settings size={24} style={{ color: getContrastColor(formData.customColors.header) }} /></Button>
        </div>

        <div className="relative">
          <div className="relative h-56 w-full bg-muted overflow-hidden">
            <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
          </div>
          <div className="px-6 -mt-20 flex flex-col items-center pb-10">
            <Avatar className="h-36 w-36 border-4 border-white bg-white shadow-2xl pointer-events-auto">
              <AvatarImage src={formData.profilePic} className="object-cover" />
              <AvatarFallback className="text-2xl font-black uppercase">{formData.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center mt-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || user.displayName || "Innovator"}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(formData.customColors.userInfo) }}>Master Innovator</p>
            </div>
            <div className="p-8 rounded-[3rem] border w-full mt-8 shadow-xl pointer-events-auto" style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}>
              <p className="text-center text-[13px] leading-relaxed font-bold italic" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
                {formData.bio || "Building the future of shared intelligence in the sphere."}
              </p>
            </div>
          </div>
        </div>

        <div className="py-12 px-10">
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

        <Tabs defaultValue="photo" className="w-full pointer-events-auto">
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
          <div className="min-h-[400px] pb-32">
            <TabsContent value="photo" className="mt-0 py-20 text-center">
              <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>Empty Canvas</p>
            </TabsContent>
            <TabsContent value="video" className="mt-0 py-20 text-center">
              <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Records</p>
            </TabsContent>
            <TabsContent value="text" className="mt-0 py-20 text-center">
              <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: getContrastColor(formData.customColors.tabsContent) }}>No Concepts</p>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-md w-[95%] rounded-[3rem] p-7 max-h-[90vh] overflow-y-auto z-[3000] no-scrollbar border-none shadow-2xl flex flex-col"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Customize Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Banner Image</Label>
                <div className="relative h-32 w-full rounded-[2rem] overflow-hidden border-2 border-muted bg-muted group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                  <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="Banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={24} /></div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Profile Logo</Label>
                <div className="relative h-24 w-24 rounded-full border-4 border-white bg-white shadow-xl group cursor-pointer overflow-hidden" onClick={() => profileInputRef.current?.click()}>
                  <Image src={formData.profilePic} alt="Logo" fill className="object-cover" unoptimized={true} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={24} /></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Username</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-2xl h-12 bg-muted/30 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">About Me</Label>
                <Textarea value={formData.bio} maxLength={160} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl min-h-[80px] bg-muted/30 border-none font-medium" />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2 text-primary"><PaintBucket size={16} /> Surface Colors</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('header')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Header</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.header || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('background')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Background</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.background || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('userInfo')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Profile Box</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.userInfo || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('bioCard')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Bio Card</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.bioCard || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('statsSection')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Stats Area</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.statsSection || '#F3F4F6' }} />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-muted" onClick={() => openPickerFor('tabsList')}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Tabs Bar</span>
                  <div className="w-8 h-2 rounded-full border" style={{ backgroundColor: formData.customColors.tabsList || '#F3F4F6' }} />
                </Button>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t">
               <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center justify-between">
                 <span>Sticker Studio</span>
                 {activeStickerId && (
                   <Button variant="ghost" size="sm" onClick={() => setActiveStickerId(null)} className="h-6 text-[8px] font-bold">Deselect</Button>
                 )}
               </Label>
               
               <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-3xl">
                 <Button variant="outline" className="w-20 h-20 shrink-0 rounded-2xl flex flex-col gap-2 border-dashed" onClick={() => stickerInputRef.current?.click()}>
                    <Plus size={24} />
                    <span className="text-[8px] font-bold">New</span>
                 </Button>
                 <div className="flex-1 overflow-x-auto no-scrollbar">
                    <div className="flex gap-3">
                      {formData.stickers.map(s => (
                        <button key={s.id} onClick={() => setActiveStickerId(s.id)} className={cn("w-16 h-16 shrink-0 border-2 rounded-xl p-1 relative", activeStickerId === s.id ? "border-primary bg-primary/10" : "border-muted-foreground/10")}>
                          <Image src={s.url} alt="sticker" width={64} height={64} className="object-contain w-full h-full" unoptimized={true}/>
                        </button>
                      ))}
                    </div>
                 </div>
               </div>

               {activeSticker && (
                 <div className="space-y-6 p-5 bg-primary/5 rounded-[2rem] border border-primary/10 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase text-primary tracking-widest">Active Sticker Tools</p>
                       <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeSticker(activeSticker.id)}>
                          <Trash2 size={16} />
                       </Button>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                           <Label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Scale Size</Label>
                           <span className="text-[9px] font-black text-primary">{Math.round(activeSticker.scale * 100)}%</span>
                         </div>
                         <Slider 
                           value={[activeSticker.scale]} 
                           min={0.2} 
                           max={3} 
                           step={0.1} 
                           onValueChange={([v]) => updateSticker(activeSticker.id, { scale: v })}
                         />
                       </div>

                       <div className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                           <Label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Rotation</Label>
                           <span className="text-[9px] font-black text-primary">{activeSticker.rotation}°</span>
                         </div>
                         <Slider 
                           value={[activeSticker.rotation]} 
                           min={0} 
                           max={360} 
                           step={5} 
                           onValueChange={([v]) => updateSticker(activeSticker.id, { rotation: v })}
                         />
                       </div>
                    </div>
                    <p className="text-[8px] text-center font-bold text-muted-foreground/60">Drag the sticker directly on your profile to reposition.</p>
                 </div>
               )}
            </div>
            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button className="w-full h-14 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest shadow-xl" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Publish Profile Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-[3rem] p-8 max-h-[70vh] overflow-y-auto no-scrollbar border-none z-[4100]">
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-primary mb-6">Select Color</SheetTitle></SheetHeader>
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
          <SheetHeader><SheetTitle className="text-[10px] font-black uppercase tracking-widest text-center mb-4">Settings</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <Button variant="outline" className="w-full justify-start h-14 rounded-2xl px-6 gap-4 border-primary/20 text-primary font-black uppercase tracking-widest" onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}><Pencil size={18} /> Customize Theme</Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-14 rounded-2xl px-6 gap-4 text-secondary font-black uppercase tracking-widest hover:bg-secondary/10"><LogOut size={18} /> Sign Out</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

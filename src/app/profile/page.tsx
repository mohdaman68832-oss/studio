
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Grid, Bookmark, Heart, LogOut, Camera, Image as ImageIcon, Plus, Trash2, RotateCw, Maximize, X, PaintBucket, Pencil, Loader2, Monitor, Smartphone, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  "#FFFFFF", "#F8FAFC", "#F0FDF4", "#ECFDF5", "#EFF6FF", "#F5F3FF", "#FDF2F8", "#FFF7ED", "#FFFBEB", "#FEF2F2",
  "#DBEAFE", "#D1FAE5", "#E0E7FF", "#FCE7F3", "#FFEDD5", "#E9D5FF", "#CFFAFE", "#F2F3F5", "#ECFEFF", "#F5F5F5"
];

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return 'inherit';
  const r = parseInt(hexColor.slice(1, 3), 16), g = parseInt(hexColor.slice(3, 5), 16), b = parseInt(hexColor.slice(5, 7), 16);
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
    updateDoc(profileRef, { ...updates, updatedAt: new Date().toISOString() });
  };

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      // NOTE: We do NOT update auth.photoURL if it's a large Base64 string to avoid Firebase errors.
      // We rely on Firestore for the profile image source of truth.
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
      toast({ title: "Success", description: "Profile saved!" });
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
      if (el && el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) {
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
        saveToFirestore({ profilePictureUrl: base64 });
      } else if (type === 'banner') {
        setTempBannerUrl(base64);
        setShowBannerEditor(true);
        setIsEditModalOpen(false);
      } else if (type === 'sticker') {
        const newSticker = { id: Math.random().toString(36).substr(2, 9), url: base64, x: 50, y: 20, rotation: 0, scale: 1 };
        const updated = [...formData.stickers, newSticker];
        setFormData(prev => ({ ...prev, stickers: updated }));
        saveToFirestore({ stickers: updated });
        setActiveStickerId(newSticker.id);
        setIsEditModalOpen(false);
      }
    }
  };

  if (isUserLoading || isProfileLoading) return <div className="max-w-md mx-auto p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;
  if (!user) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-md mx-auto min-h-screen pt-0 pb-24 relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
    >
      {showBannerEditor && (
        <div className="fixed inset-0 z-[1000] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b bg-white">
            <Button variant="ghost" size="icon" onClick={() => setShowBannerEditor(false)} className="rounded-full"><ChevronLeft size={24} /></Button>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Reposition Banner</h2>
            <div className="w-10" />
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-center text-muted-foreground">Drag the image to adjust its position</p>
              <div 
                className="relative aspect-[3/1] w-full bg-black rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing touch-none shadow-2xl"
                onPointerDown={(e) => { 
                  setIsDraggingBanner(true); 
                  setDragStartY(e.clientY); 
                  (e.currentTarget as any).setPointerCapture(e.pointerId); 
                }}
                onPointerMove={handleBannerDragMove}
                onPointerUp={handleBannerDragEnd}
              >
                {tempBannerUrl && (
                  <Image src={tempBannerUrl} alt="Preview" fill className="object-cover select-none pointer-events-none" style={{ objectPosition: `50% ${bannerOffset}%` }} unoptimized={true} />
                )}
              </div>
            </div>
            <Button onClick={() => { setFormData(prev => ({ ...prev, banner: tempBannerUrl!, bannerOffset })); saveToFirestore({ bannerUrl: tempBannerUrl, bannerOffset }); setShowBannerEditor(false); setIsEditModalOpen(true); }} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl">Apply Banner Position</Button>
          </div>
        </div>
      )}

      <div className="px-6 flex justify-between items-center py-4 relative z-20" style={{ backgroundColor: formData.customColors.header }}>
        <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: getContrastColor(formData.customColors.header) }}>Profile</h1>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSettingsOpen(true)}><Settings size={22} style={{ color: getContrastColor(formData.customColors.header) }} /></Button>
      </div>

      <div className="pb-8 relative z-10" style={{ backgroundColor: formData.customColors.userInfo }}>
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
          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-sm" style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}>
            <p className="text-center text-xs leading-relaxed font-medium italic break-all overflow-hidden" style={{ color: getContrastColor(formData.customColors.bioCard) }}>{formData.bio || "Crafting new ideas daily in the sphere."}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-ideas" className="w-full relative z-10 pb-24">
        <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-14" style={{ backgroundColor: formData.customColors.tabsList }}>
          <TabsTrigger value="my-ideas" className="flex-1 rounded-none"><Grid size={22} /></TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none"><Bookmark size={22} /></TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none"><Heart size={22} /></TabsTrigger>
        </TabsList>
        <TabsContent value="my-ideas" className="px-1 py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Your Posted Innovations Will Appear Here</TabsContent>
      </Tabs>

      <div className="absolute inset-0 pointer-events-none z-[30]">
        {formData.stickers.map((sticker) => (
          <div key={sticker.id} className={cn("absolute pointer-events-auto", activeStickerId === sticker.id ? "ring-2 ring-primary rounded-xl" : "")} style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, touchAction: 'none' }}>
            <div className="relative w-24 h-24" onPointerDown={(e) => { if (activeStickerId === sticker.id) { setDraggedStickerId(sticker.id); (e.currentTarget as any).setPointerCapture(e.pointerId); } }} onPointerMove={(e) => { if (draggedStickerId === sticker.id) { const rect = containerRef.current!.getBoundingClientRect(); setFormData(prev => ({ ...prev, stickers: prev.stickers.map(s => s.id === sticker.id ? { ...s, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 } : s) })); } }} onPointerUp={(e) => { setDraggedStickerId(null); saveToFirestore({ stickers: formData.stickers }); try { (e.currentTarget as any).releasePointerCapture(e.pointerId); } catch {} }}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto z-[600] no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase text-center text-primary">Optimize Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Banner</Label>
                <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-muted-foreground/10 cursor-pointer hover:border-primary/50 transition-all group" onClick={() => bannerInputRef.current?.click()}>
                  {formData.banner ? <Image src={formData.banner} alt="Banner" fill className="object-cover group-hover:scale-105 transition-transform" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-muted-foreground/30" /></div>}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera size={20} className="text-white drop-shadow-md" /></div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Logo</Label>
                <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-muted-foreground/10 cursor-pointer hover:border-primary/50 transition-all group flex items-center justify-center" onClick={() => profileInputRef.current?.click()}>
                  <Avatar className="h-14 w-14 border-2 border-white shadow-md group-hover:scale-110 transition-transform"><AvatarImage src={formData.profilePic} className="object-cover" /><AvatarFallback className="text-xl font-black">{formData.name?.[0] || "U"}</AvatarFallback></Avatar>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera size={20} className="text-white drop-shadow-md" /></div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Display Name</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-2xl h-12 bg-muted/20 border-none" placeholder="Your Name"/></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Bio Description</Label><Textarea value={formData.bio} maxLength={160} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl min-h-[80px] bg-muted/20 border-none" placeholder="Share your innovation journey..."/></div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2"><PaintBucket size={14} /> Theme Palette</Label>
              <div className="flex flex-wrap gap-2 p-1">{PALETTE.map(c => <button key={c} onClick={() => setFormData(prev => ({ ...prev, customColors: { ...prev.customColors, background: c } }))} className="w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform active:scale-90" style={{ backgroundColor: c }} />)}</div>
            </div>
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Stickers & Decals</Label>
               <Button variant="secondary" className="w-full h-12 rounded-2xl flex items-center gap-2 font-bold uppercase text-[10px]" onClick={() => stickerInputRef.current?.click()}><Plus size={16} /> Add New Sticker</Button>
               {formData.stickers.length > 0 && <div className="flex flex-wrap gap-2">{formData.stickers.map(s => <button key={s.id} onClick={() => { setActiveStickerId(s.id === activeStickerId ? null : s.id); setIsEditModalOpen(false); }} className={cn("w-12 h-12 border rounded-xl p-1 relative", activeStickerId === s.id ? "border-primary bg-primary/10" : "border-muted")}><Image src={s.url} alt="s" width={40} height={40} className="object-contain" unoptimized={true}/></button>)}</div>}
            </div>
            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
          </div>
          <DialogFooter className="mt-4"><Button className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin mr-2" /> : "Apply Profile Updates"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-6 border-none z-[500]">
          <SheetHeader><SheetTitle className="text-sm font-black uppercase tracking-[0.2em] text-center text-muted-foreground">Sphere Settings</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-8">
            <Button variant="outline" className="w-full justify-between h-14 rounded-2xl px-6 border-primary/20 text-primary font-black uppercase" onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}><span className="flex items-center gap-4"><Pencil size={18} /> Customize Profile</span><RotateCw size={16} className="opacity-40" /></Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-14 rounded-2xl px-6 gap-4 text-secondary font-black uppercase"><LogOut size={18} /> Sign Out From Sphere</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

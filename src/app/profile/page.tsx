
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

const PALETTE = ["#FFFFFF", "#FDF2F2", "#F0FDF4", "#EFF6FF", "#FFFBEB", "#008080", "#FF4500", "#FFD700", "#4CAF50", "#2196F3", "#9C27B0", "#E91E63", "#000000", "#F2F3F5"];

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
  const [isPaintMode, setIsPaintMode] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);

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

  const handleSignOut = async () => { await signOut(auth); router.push("/login"); };

  const saveToFirestore = async (updates: any) => {
    if (!profileRef) return;
    updateDoc(profileRef, { ...updates, updatedAt: new Date().toISOString() });
  };

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: formData.name, photoURL: formData.profilePic });
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
      setIsPaintMode(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
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
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner' | 'sticker') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') {
        setFormData(prev => ({ ...prev, profilePic: base64 }));
        if (user) updateProfile(user, { photoURL: base64 });
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

  if (isUserLoading || isProfileLoading) return <div className="max-w-md mx-auto p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
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
              <span className="text-[10px] font-black uppercase">Drag to Reposition</span>
              <div 
                className="relative aspect-[3/1] w-full bg-black rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => { setIsDraggingBanner(true); setDragStartY(e.clientY); (e.currentTarget as any).setPointerCapture(e.pointerId); }}
                onPointerMove={handleBannerDragMove}
                onPointerUp={handleBannerDragEnd}
              >
                {tempBannerUrl && <Image src={tempBannerUrl} alt="Preview" fill className="object-cover select-none pointer-events-none" style={{ objectPosition: `50% ${bannerOffset}%` }} unoptimized={true} />}
              </div>
            </div>
            <Button onClick={() => { setFormData(prev => ({ ...prev, banner: tempBannerUrl!, bannerOffset })); saveToFirestore({ bannerUrl: tempBannerUrl, bannerOffset }); setShowBannerEditor(false); setIsEditModalOpen(true); }} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase">Apply Banner</Button>
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
            <AvatarImage src={formData.profilePic} />
            <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="text-center mt-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || user.displayName || "Innovator"}</h2>
          </div>
          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-sm" style={{ backgroundColor: formData.customColors.bioCard || "#FFFFFF" }}>
            <p className="text-center text-xs leading-relaxed font-medium italic break-all" style={{ color: getContrastColor(formData.customColors.bioCard) }}>{formData.bio || "Crafting new ideas daily."}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-ideas" className="w-full relative z-10 pb-24">
        <TabsList className="w-full bg-transparent border-none rounded-none px-6 h-14" style={{ backgroundColor: formData.customColors.tabsList }}>
          <TabsTrigger value="my-ideas" className="flex-1 rounded-none"><Grid size={22} /></TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none"><Bookmark size={22} /></TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none"><Heart size={22} /></TabsTrigger>
        </TabsList>
        <TabsContent value="my-ideas" className="px-1"><div className="grid grid-cols-3 gap-1 opacity-20 py-20 text-center uppercase text-[10px] font-black w-full"><div className="col-span-3">Your Ideas</div></div></TabsContent>
      </Tabs>

      <div className="absolute inset-0 pointer-events-none z-[30]">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id}
            className={cn("absolute pointer-events-auto", activeStickerId === sticker.id ? "ring-2 ring-primary rounded-xl" : "")}
            style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, touchAction: 'none' }}
          >
            <div className="relative w-24 h-24" onPointerDown={(e) => { if (activeStickerId === sticker.id) { setDraggedStickerId(sticker.id); (e.currentTarget as any).setPointerCapture(e.pointerId); } }} onPointerMove={(e) => { if (draggedStickerId === sticker.id) { const rect = containerRef.current!.getBoundingClientRect(); setFormData(prev => ({ ...prev, stickers: prev.stickers.map(s => s.id === sticker.id ? { ...s, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 } : s) })); } }} onPointerUp={(e) => { setDraggedStickerId(null); saveToFirestore({ stickers: formData.stickers }); try { (e.currentTarget as any).releasePointerCapture(e.pointerId); } catch {} }}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto z-[600]">
          <DialogHeader><DialogTitle className="text-sm font-black uppercase text-center">Customize Profile</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Name</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-2xl" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Bio (Max 160)</Label><Textarea value={formData.bio} maxLength={160} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Paint Theme</Label><div className="flex flex-wrap gap-2">{PALETTE.map(c => <button key={c} onClick={() => { setActiveColor(c); setIsPaintMode(true); setIsEditModalOpen(false); }} className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: c }} />)}</div></div>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => bannerInputRef.current?.click()}>Change Banner</Button>
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => stickerInputRef.current?.click()}>Add Sticker</Button>
            <div className="flex flex-wrap gap-2">{formData.stickers.map(s => <button key={s.id} onClick={() => { setActiveStickerId(s.id); setIsEditModalOpen(false); }} className="w-10 h-10 border rounded-xl p-1"><Image src={s.url} alt="s" width={40} height={40} className="object-contain" unoptimized={true}/></button>)}</div>
          </div>
          <DialogFooter><Button className="w-full h-12 rounded-2xl bg-primary text-white font-black" onClick={handleSaveProfile}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-6 border-none z-[500]">
          <SheetHeader><SheetTitle className="text-sm font-black uppercase">Settings</SheetTitle></SheetHeader>
          <div className="space-y-2 mt-4">
            <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4" onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}><Pencil size={18} /> Edit Profile</Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-14 rounded-2xl gap-4 text-secondary"><LogOut size={18} /> Sign Out</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

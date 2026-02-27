
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, Grid, Bookmark, Heart, LogOut, Camera, 
  Image as ImageIcon, Plus, RotateCw, Pencil, Loader2, 
  Tablet, ChevronLeft, PaintBucket,
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
      toast({ title: "Success", description: "Sphere profile updated!" });
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
        const newSticker = { id: Math.random().toString(36).substr(2, 9), url: base64, x: 50, y: 20, rotation: 0, scale: 1 };
        setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
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
      {/* BANNER REPOSITION OVERLAY */}
      {showBannerEditor && (
        <div className="fixed inset-0 z-[2000] bg-background flex flex-col animate-in slide-in-from-bottom duration-300 overflow-y-auto no-scrollbar">
          <header className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-50">
            <Button variant="ghost" size="icon" onClick={() => setShowBannerEditor(false)} className="rounded-full"><ChevronLeft size={24} /></Button>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Reposition Banner</h2>
            <div className="w-10" />
          </header>
          
          <div className="flex-1 p-6 space-y-12 pb-32">
            <div className="text-center bg-primary/5 p-4 rounded-3xl border border-primary/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Manual Adjustment</p>
              <p className="text-[11px] font-bold text-muted-foreground">Click and drag inside the frame to set the banner focal point.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Tablet size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Tablet Device Frame</span>
              </div>
              <div className="relative aspect-[4/3] w-full max-w-[90%] mx-auto bg-slate-900 rounded-[3rem] overflow-hidden border-[12px] border-slate-800 shadow-2xl">
                <div 
                  className="h-full w-full relative cursor-grab active:cursor-grabbing touch-none flex flex-col rounded-[2rem] overflow-hidden"
                  onPointerDown={(e) => { 
                    setIsDraggingBanner(true); 
                    setDragStartY(e.clientY); 
                    try { (e.currentTarget as any).setPointerCapture(e.pointerId); } catch {}
                  }}
                  onPointerMove={handleBannerDragMove}
                  onPointerUp={handleBannerDragEnd}
                >
                  <div className="h-10 w-full bg-slate-900/80 backdrop-blur-sm border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[6px] font-black text-white">N</div>
                    <div className="text-[6px] font-black text-white/40 uppercase tracking-widest">Profile</div>
                  </div>

                  <div className="flex-1 w-full relative bg-slate-800 overflow-hidden">
                    {tempBannerUrl && (
                      <Image 
                        src={tempBannerUrl} 
                        alt="Tablet" 
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
            </div>

            <div className="pt-8 space-y-4 sticky bottom-0 bg-background/80 backdrop-blur-md p-4 -mx-6">
               <Button onClick={() => { setFormData(prev => ({ ...prev, banner: tempBannerUrl!, bannerOffset })); setShowBannerEditor(false); setIsEditModalOpen(true); }} className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl">Apply Changes</Button>
               <Button variant="ghost" onClick={() => setShowBannerEditor(false)} className="w-full font-bold uppercase text-[10px]">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* NORMAL PROFILE HEADER */}
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
        <TabsContent value="my-ideas" className="px-1 py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Your Innovations Will Appear Here</TabsContent>
      </Tabs>

      {/* STICKERS LAYER */}
      <div className="absolute inset-0 pointer-events-none z-[30]">
        {formData.stickers.map((sticker) => (
          <div key={sticker.id} className={cn("absolute pointer-events-auto", activeStickerId === sticker.id ? "ring-2 ring-primary rounded-xl" : "")} style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`, touchAction: 'none' }}>
            <div className="relative w-24 h-24" 
              onPointerDown={(e) => { if (activeStickerId === sticker.id) { setDraggedStickerId(sticker.id); try { (e.currentTarget as any).setPointerCapture(e.pointerId); } catch {} } }} 
              onPointerMove={(e) => { if (draggedStickerId === sticker.id) { const rect = containerRef.current!.getBoundingClientRect(); setFormData(prev => ({ ...prev, stickers: prev.stickers.map(s => s.id === sticker.id ? { ...s, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 } : s) })); } }} 
              onPointerUp={(e) => { setDraggedStickerId(null); try { (e.currentTarget as any).releasePointerCapture(e.pointerId); } catch {} }}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized={true} />
            </div>
          </div>
        ))}
      </div>

      {/* EDIT PROFILE MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto z-[3000] no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase text-center text-primary">Optimize Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-4">
            {/* Visual Preview Section - Stacking Banner Above Logo */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Current Banner</Label>
                <div 
                  className="relative h-28 w-full rounded-2xl overflow-hidden border bg-muted shadow-sm group cursor-pointer"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="Banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized={true} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Current Logo</Label>
                <div className="flex justify-center">
                  <div 
                    className="relative h-24 w-24 rounded-full border-4 border-white bg-white shadow-md group cursor-pointer overflow-hidden"
                    onClick={() => profileInputRef.current?.click()}
                  >
                    <Image src={formData.profilePic} alt="Logo" fill className="object-cover" unoptimized={true} />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white" size={20} />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground font-bold text-center">Tap images above to change photos</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Display Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-2xl h-12 bg-muted/20 border-none" placeholder="Your Name"/>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Bio (max 160 characters)</Label>
                <Textarea value={formData.bio} maxLength={160} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl min-h-[80px] bg-muted/20 border-none" placeholder="Share your journey..."/>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2"><PaintBucket size={14} /> Soft Theme Colors</Label>
              <div className="flex flex-wrap gap-2 p-1">
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setFormData(prev => ({ ...prev, customColors: { ...prev.customColors, background: c } }))} className="w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform active:scale-90" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Stickers & Decals</Label>
               <Button variant="secondary" className="w-full h-12 rounded-2xl flex items-center gap-2 font-bold uppercase text-[10px]" onClick={() => stickerInputRef.current?.click()}><Plus size={16} /> Add New Sticker</Button>
               {formData.stickers.length > 0 && (
                 <div className="flex flex-wrap gap-2">
                   {formData.stickers.map(s => (
                     <button key={s.id} onClick={() => { setActiveStickerId(s.id === activeStickerId ? null : s.id); setIsEditModalOpen(false); }} className={cn("w-12 h-12 border rounded-xl p-1 relative", activeStickerId === s.id ? "border-primary bg-primary/10" : "border-muted")}>
                       <Image src={s.url} alt="s" width={40} height={40} className="object-contain" unoptimized={true}/>
                     </button>
                   ))}
                 </div>
               )}
            </div>

            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
          </div>
          <DialogFooter className="mt-4">
            <Button className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Apply Profile Updates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SETTINGS SHEET */}
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-6 border-none z-[4000]">
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

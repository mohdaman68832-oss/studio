
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Grid, Bookmark, Heart, LogOut, Camera, Image as ImageIcon, Plus, Trash2, RotateCw, Maximize, X, PaintBucket, Pencil, Loader2 } from "lucide-react";
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

interface Sticker {
  id: string;
  url: string;
  x: number; // percentage
  y: number; // percentage
  rotation: number; // degrees
  scale: number; // 0.5 to 2.0
}

interface CustomColors {
  header?: string;
  bioCard?: string;
  statsSection?: string;
  background?: string;
}

const PALETTE = [
  "#FFFFFF", "#FDF2F2", "#F0FDF4", "#EFF6FF", "#FFFBEB",
  "#008080", "#FF4500", "#FFD700", "#4CAF50", "#2196F3",
  "#9C27B0", "#E91E63", "#000000", "#F2F3F5", "#FFE4E1"
];

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
  
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [isPaintMode, setIsPaintMode] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profilePic: "",
    banner: "",
    stickers: [] as Sticker[],
    customColors: {} as CustomColors
  });

  const profileRef = useMemoFirebase(() => (user ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: user?.displayName || "",
        bio: profileData.bio || "",
        profilePic: user?.photoURL || profileData.profilePictureUrl || "",
        banner: profileData.bannerUrl || "",
        stickers: profileData.stickers || [],
        customColors: profileData.customColors || {}
      });
    }
  }, [profileData, user]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner' | 'sticker') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'profile') setFormData(prev => ({ ...prev, profilePic: url }));
      else if (type === 'banner') setFormData(prev => ({ ...prev, banner: url }));
      else if (type === 'sticker') {
        const newStickerId = Math.random().toString(36).substr(2, 9);
        const newSticker: Sticker = {
          id: newStickerId,
          url: url,
          x: 50,
          y: 50,
          rotation: 0,
          scale: 1
        };
        setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
        setActiveStickerId(newStickerId);
        setIsEditModalOpen(false);
        toast({
          title: "Sticker Added",
          description: "Sticker added! Go to settings > Move to place it in an empty space.",
        });
      }
    }
  };

  const applyColor = (zone: keyof CustomColors) => {
    if (!activeColor) return;
    setFormData(prev => ({
      ...prev,
      customColors: {
        ...prev.customColors,
        [zone]: activeColor
      }
    }));
  };

  const handleZoneClick = (e: React.MouseEvent, zone: keyof CustomColors) => {
    if (isPaintMode && activeColor) {
      e.stopPropagation();
      applyColor(zone);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedStickerId || !headerRef.current) return;

    const rect = headerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Boundary check for header area only
    if (y > 100) return;

    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === draggedStickerId ? { ...s, x, y } : s)
    }));
  };

  const handlePointerUp = () => {
    setDraggedStickerId(null);
  };

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);

    try {
      await updateProfile(user, {
        displayName: formData.name,
        photoURL: formData.profilePic
      });

      await updateDoc(profileRef, {
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        stickers: formData.stickers,
        customColors: formData.customColors,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditModalOpen(false);
      setActiveStickerId(null);
      setIsPaintMode(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
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

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div 
      className="max-w-md mx-auto min-h-screen pt-6 pb-24 relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: formData.customColors.background || "var(--background)" }}
    >
      
      {/* Paint Mode Active Banner */}
      {isPaintMode && activeColor && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-white px-6 py-2 rounded-full shadow-2xl border-2 border-primary flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: activeColor }}></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Brush Active: Tap area to paint</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0 rounded-full" onClick={() => setIsPaintMode(false)}><X size={14}/></Button>
        </div>
      )}

      {/* Floating Adjustment Bar */}
      {activeStickerId && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[340px] bg-white rounded-3xl shadow-2xl border border-primary/20 p-4 space-y-4 animate-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary">Edit Sticker Position</span>
             <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={() => {
                   setFormData(prev => ({ ...prev, stickers: prev.stickers.filter(s => s.id !== activeStickerId) }));
                   setActiveStickerId(null);
                }}><Trash2 size={16} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setActiveStickerId(null)}><X size={16} /></Button>
             </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <RotateCw size={14} className="text-muted-foreground shrink-0" />
                  <Slider value={[formData.stickers.find(s => s.id === activeStickerId)?.rotation || 0]} max={360} onValueChange={([v]) => updateActiveSticker({ rotation: v })} />
                </div>
                <div className="flex items-center gap-4">
                  <Maximize size={14} className="text-muted-foreground shrink-0" />
                  <Slider value={[(formData.stickers.find(s => s.id === activeStickerId)?.scale || 1) * 100]} min={50} max={200} onValueChange={([v]) => updateActiveSticker({ scale: v / 100 })} />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground italic text-center">Drag on empty profile space to reposition.</p>
            <Button className="w-full h-10 rounded-2xl bg-primary text-white text-[10px] font-black uppercase" onClick={handleSaveProfile} disabled={isSaving}>Lock Position</Button>
          </div>
        </div>
      )}

      <div 
        onClick={(e) => handleZoneClick(e, 'header')}
        className="px-6 flex justify-between items-center mb-6 relative z-10 py-2 transition-colors"
        style={{ backgroundColor: formData.customColors.header }}
      >
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Profile</h1>
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}><Settings size={22} className="text-primary" /></Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] p-6 border-none shadow-none">
            <SheetHeader className="mb-6"><SheetTitle className="text-center text-sm font-black uppercase">Menu</SheetTitle></SheetHeader>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4" onClick={() => { setIsSettingsOpen(false); setIsEditModalOpen(true); }}><Pencil size={18} /> Edit Profile</Button>
              <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-14 rounded-2xl gap-4 text-secondary"><LogOut size={18} /> Logout</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto no-scrollbar border-none">
          <DialogHeader><DialogTitle className="text-sm font-black uppercase text-center">Customize Profile</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <PaintBucket size={12} className="text-primary" /> Pick a color to paint zones
              </Label>
              <div className="flex flex-wrap gap-2 justify-center bg-muted/30 p-4 rounded-3xl">
                {PALETTE.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setActiveColor(color);
                      setIsPaintMode(true);
                      setIsEditModalOpen(false);
                      toast({ title: "Painting Mode", description: "Tap any section on your profile (Header, Bio, Stats, or Background) to paint it." });
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      activeColor === color ? "border-primary scale-110" : "border-white"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Banner</Label>
              <div onClick={() => bannerInputRef.current?.click()} className="relative h-24 bg-muted rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-primary/10">
                {formData.banner ? <Image src={formData.banner} alt="Banner" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon /></div>}
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            </div>

            <div className="flex items-center gap-4">
               <div className="relative w-20 h-20 rounded-full bg-muted overflow-hidden border">
                 <Image src={formData.profilePic || `https://picsum.photos/seed/${user.uid}/200/200`} alt="Profile" fill className="object-cover" />
                 <button onClick={() => profileInputRef.current?.click()} className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100"><Camera className="text-white" size={16} /></button>
               </div>
               <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Display Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl h-10 bg-muted/20 border-none" />
               </div>
               <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Bio</Label>
              <Textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} className="rounded-2xl h-24 bg-muted/20 border-none resize-none" />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest">Stickers</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-full h-12 w-12 border-2 border-dashed border-primary/20" onClick={() => stickerInputRef.current?.click()}><Plus size={20} /></Button>
                {formData.stickers.map(s => (
                  <div key={s.id} className="relative w-12 h-12 rounded-xl bg-muted border p-1 group">
                    <Image src={s.url} alt="sticker" fill className="object-contain p-1" />
                    <button 
                      onClick={() => { setActiveStickerId(s.id); setIsEditModalOpen(false); }} 
                      className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black text-white uppercase rounded-xl"
                    >
                      Move
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 mt-4">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 uppercase font-black text-[10px]" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button className="flex-1 rounded-2xl h-12 uppercase font-black text-[10px] bg-primary" onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Profile"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div 
        ref={headerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={(e) => handleZoneClick(e, 'background')}
        className="relative z-10 min-h-[500px] select-none"
      >
        {/* Stickers */}
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id}
            onPointerDown={(e) => {
              if (activeStickerId !== sticker.id) return;
              e.stopPropagation();
              setDraggedStickerId(sticker.id);
            }}
            className={cn(
              "absolute z-[45] transition-shadow",
              activeStickerId === sticker.id ? "cursor-grab active:cursor-grabbing ring-2 ring-primary ring-offset-2 rounded-xl" : "pointer-events-none",
            )}
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`,
              touchAction: 'none'
            }}
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              <Image src={sticker.url} alt="sticker" fill className="object-contain" draggable={false} />
            </div>
          </div>
        ))}

        {/* Banner Area Zone */}
        <div 
          className="relative h-48 w-full bg-muted overflow-hidden transition-colors duration-300"
        >
          <Image 
            src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} 
            alt="banner" 
            fill 
            className="object-cover" 
            draggable={false}
            onClick={(e) => e.stopPropagation()} // Banner Image blocks sticker placement/painting directly ON it
          />
        </div>

        <div className="px-6 -mt-16 flex flex-col items-center mb-8 relative z-10">
          <div 
            className="relative mb-4 cursor-default"
            onPointerDown={(e) => e.stopPropagation()} // Avatar blocks sticker movement trigger
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="h-32 w-32 border-4 border-white shadow-none bg-white">
              <AvatarImage src={formData.profilePic} />
              <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
          </div>
          
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-1">{user.displayName || "Innovator"}</h2>
          <p className="text-sm font-bold text-primary mb-4 tracking-widest uppercase">@{profileData?.username || "user"}</p>
          
          {/* Bio Card Zone */}
          <div 
            onClick={(e) => handleZoneClick(e, 'bioCard')}
            className="p-6 rounded-[2.5rem] border shadow-none w-full transition-colors duration-300 bg-white mb-6 cursor-pointer"
            style={{ 
              backgroundColor: formData.customColors.bioCard || "#FFFFFF",
            }}
          >
            <p 
              className="text-center text-xs text-muted-foreground leading-relaxed font-medium italic"
              onClick={(e) => e.stopPropagation()} // Bio Text blocks clicks if painting
            >
              {formData.bio || "Crafting the next generation of innovative solutions."}
            </p>
          </div>
          
          {/* Stats Section Zone */}
          <div 
            onClick={(e) => handleZoneClick(e, 'statsSection')}
            className="grid grid-cols-3 gap-8 w-full py-6 px-4 rounded-[2rem] transition-colors duration-300 border bg-white/50 cursor-pointer"
            style={{ backgroundColor: formData.customColors.statsSection }}
          >
            <div className="text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-xl font-black text-primary">{profileData?.totalIdeasPosted || 0}</p>
              <p className="text-[10px] uppercase font-black text-muted-foreground">Ideas</p>
            </div>
            <div className="text-center border-x border-border/50" onClick={(e) => e.stopPropagation()}>
              <p className="text-xl font-black text-primary">{(profileData?.totalViewsReceived || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase font-black text-muted-foreground">Views</p>
            </div>
            <div className="text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-xl font-black text-primary">{(profileData?.totalIdeasSaved || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase font-black text-muted-foreground">Saves</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-0">
        <Tabs defaultValue="my-ideas" className="w-full">
          <TabsList className="w-full bg-transparent border-b rounded-none px-6 h-14">
            <TabsTrigger value="my-ideas" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary"><Grid size={22} /></TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary"><Bookmark size={22} /></TabsTrigger>
            <TabsTrigger value="liked" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary"><Heart size={22} /></TabsTrigger>
          </TabsList>
          <TabsContent value="my-ideas" className="px-1 mt-2">
            <div className="grid grid-cols-3 gap-1">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="aspect-square relative overflow-hidden group">
                  <Image src={`https://picsum.photos/seed/idea${user.uid}${i}/400/400`} alt="idea" fill className="object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

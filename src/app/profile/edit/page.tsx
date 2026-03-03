
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Loader2, Camera, Palette, Sticker as StickerIcon, X, Plus, Move, Maximize2, RotateCw, Check, Image as ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
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
  background?: string;
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? 'hsl(var(--primary))' : '#FFFFFF';
}

export default function ProfileEditPage() {
  const { user, loading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isStickerSheetOpen, setIsStickerSheetOpen] = useState(false);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profilePic: "",
    banner: "",
    stickers: [] as Sticker[],
    customColors: {
      header: "#FF4500",
      userInfo: "#FDF6F2",
      bioCard: "#FFFFFF",
      statsSection: "#FDF6F2",
      background: "#FDF6F2"
    } as CustomColors
  });

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || user?.displayName || "",
        bio: profileData.bio || "",
        profilePic: profileData.profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || "",
        stickers: profileData.stickers || [],
        customColors: {
          header: profileData.customColors?.header || "#FF4500",
          userInfo: profileData.customColors?.userInfo || "#FDF6F2",
          bioCard: profileData.customColors?.bioCard || "#FFFFFF",
          statsSection: profileData.customColors?.statsSection || "#FDF6F2",
          background: profileData.customColors?.background || "#FDF6F2"
        }
      });
    }
  }, [profileData, user]);

  const handleSave = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, {
        name: formData.name,
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        stickers: formData.stickers,
        customColors: formData.customColors,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Optimized!", description: "Your profile has been updated." });
      router.push('/profile');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: "Try again later." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner' | 'sticker') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setFormData(prev => ({ ...prev, profilePic: base64 }));
      else if (type === 'banner') setFormData(prev => ({ ...prev, banner: base64 }));
      else if (type === 'sticker') {
        const id = Math.random().toString(36).substr(2, 9);
        const newSticker: Sticker = { id, url: base64, x: 50, y: 50, rotation: 0, scale: 1 };
        setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
        setSelectedStickerId(id);
        setIsStickerSheetOpen(true);
      }
    }
  };

  const updateSticker = (id: string, property: keyof Sticker, value: number) => {
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === id ? { ...s, [property]: value } : s)
    }));
  };

  const removeSticker = (id: string) => {
    setFormData(prev => ({ ...prev, stickers: prev.stickers.filter(s => s.id !== id) }));
    setSelectedStickerId(null);
    setIsStickerSheetOpen(false);
  };

  const updateColor = (key: keyof CustomColors, value: string) => {
    setFormData(prev => ({ ...prev, customColors: { ...prev.customColors, [key]: value } }));
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-8 w-8" />
    </div>
  );

  const selectedSticker = formData.stickers.find(s => s.id === selectedStickerId);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-32 relative bg-background flex flex-col">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-xl font-black uppercase tracking-tighter">Optimize</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="rounded-full px-6 h-10 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
        </Button>
      </header>

      {/* Visual Preview Section */}
      <div className="relative w-full border-b overflow-hidden" style={{ backgroundColor: formData.customColors.background }}>
        <div className="absolute inset-0 z-10 pointer-events-none opacity-50">
           {formData.stickers.map(s => (
             <div key={s.id} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})` }}>
                <Image src={s.url} alt="sticker" width={60} height={60} className="object-contain" unoptimized />
             </div>
           ))}
        </div>

        <div className="h-12 w-full" style={{ backgroundColor: formData.customColors.header }} />
        <div className="relative">
          <div className="h-40 w-full relative group">
            <Image src={formData.banner || "https://picsum.photos/seed/banner/800/400"} alt="banner" fill className="object-cover" unoptimized />
            <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} />
            </button>
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'banner')} />
          </div>
          <div className="px-6 -mt-12 flex flex-col items-center relative z-20">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                <AvatarImage src={formData.profilePic} className="object-cover" />
                <AvatarFallback>{formData.name[0] || "U"}</AvatarFallback>
              </Avatar>
              <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} />
              </button>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'profile')} />
            </div>
          </div>
        </div>
      </div>

      {/* Editing Controls */}
      <div className="p-6 space-y-10 flex-1">
        {/* Profile Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><ImageIcon size={18} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest">Identify</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Public Name</Label>
              <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="rounded-2xl h-12 bg-muted/30 border-none font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Mission Bio</Label>
              <Textarea value={formData.bio} onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))} className="rounded-2xl min-h-[100px] bg-muted/30 border-none text-xs font-medium" />
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><Palette size={18} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest">Color Sphere</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(formData.customColors) as Array<keyof CustomColors>).map(key => (
              <div key={key} className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1 opacity-50">{key.replace(/([A-Z])/g, ' $1')}</Label>
                <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-2xl border border-border/50">
                  <input 
                    type="color" 
                    value={formData.customColors[key]} 
                    onChange={e => updateColor(key, e.target.value)}
                    className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent"
                  />
                  <span className="text-[9px] font-mono font-bold uppercase">{formData.customColors[key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stickers Optimization */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><StickerIcon size={18} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest">Sticker Hub</h3>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => stickerInputRef.current?.click()}
              className="w-full h-14 rounded-3xl bg-secondary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-secondary/10"
            >
              <Plus size={18} className="mr-2" /> Add New Sticker
            </Button>
            <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'sticker')} />

            {formData.stickers.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase text-muted-foreground/60 ml-2">Active Stickers (Select to Optimize)</p>
                <div className="grid grid-cols-4 gap-3">
                  {formData.stickers.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => { setSelectedStickerId(s.id); setIsStickerSheetOpen(true); }}
                      className={cn(
                        "relative aspect-square rounded-2xl border-2 overflow-hidden bg-muted/20 transition-all",
                        selectedStickerId === s.id ? "border-primary shadow-lg scale-105" : "border-transparent"
                      )}
                    >
                      <Image src={s.url} alt="sticker" fill className="object-contain p-2" unoptimized />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticker Optimization Sheet */}
      <Sheet open={isStickerSheetOpen} onOpenChange={setIsStickerSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[3rem] h-[60vh] bg-white border-none shadow-2xl p-0 overflow-hidden flex flex-col">
          <SheetHeader className="p-6 border-b flex flex-row items-center justify-between">
            <SheetTitle className="text-xl font-black uppercase text-primary">Optimize Sticker</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsStickerSheetOpen(false)} className="rounded-full"><X size={20} /></Button>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {selectedSticker && (
              <div className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase"><span className="flex items-center gap-2"><Move size={14}/> Horizontal (X)</span><span>{selectedSticker.x}%</span></div>
                    <Slider value={[selectedSticker.x]} max={100} step={1} onValueChange={([v]) => updateSticker(selectedSticker.id, 'x', v)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase"><span className="flex items-center gap-2"><Move size={14}/> Vertical (Y)</span><span>{selectedSticker.y}%</span></div>
                    <Slider value={[selectedSticker.x]} max={100} step={1} onValueChange={([v]) => updateSticker(selectedSticker.id, 'y', v)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase"><span className="flex items-center gap-2"><Maximize2 size={14}/> Size (Scale)</span><span>{selectedSticker.scale.toFixed(1)}x</span></div>
                    <Slider value={[selectedSticker.scale]} min={0.5} max={3} step={0.1} onValueChange={([v]) => updateSticker(selectedSticker.id, 'scale', v)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase"><span className="flex items-center gap-2"><RotateCw size={14}/> Rotation</span><span>{selectedSticker.rotation}°</span></div>
                    <Slider value={[selectedSticker.rotation]} min={0} max={360} step={1} onValueChange={([v]) => updateSticker(selectedSticker.id, 'rotation', v)} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl border-2 border-destructive/20 text-destructive font-black uppercase text-[10px] hover:bg-destructive hover:text-white" onClick={() => removeSticker(selectedSticker.id)}>Remove</Button>
                  <Button className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px]" onClick={() => setIsStickerSheetOpen(false)}>Done</Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

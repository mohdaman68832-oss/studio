
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Camera, 
  Loader2, 
  UserCog,
  Sun,
  Moon,
  Palette,
  Sticker as StickerIcon,
  X,
  LayoutGrid,
  Move,
  Maximize2,
  RotateCw
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc, collection as fsCollection, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { IdeaCard } from "@/components/feed/idea-card";

interface Sticker {
  id: string;
  url: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
  scale: number; // multiplier
}

interface CustomColors {
  header?: string;
  userInfo?: string;
  bioCard?: string;
  statsSection?: string;
  background?: string;
}

function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || !hexColor.startsWith('#')) return 'hsl(var(--primary))';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? 'hsl(var(--primary))' : '#FFFFFF';
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function ProfilePage() {
  const { user, loading: isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

  const userPostsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      fsCollection(db, "posts"), 
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user?.uid]);

  const { data: userPosts, isLoading: isPostsLoading } = useCollection(userPostsQuery);
  const dynamicPostCount = userPosts?.length || 0;

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || user?.displayName || "",
        bio: profileData.bio || "",
        profilePic: profileData.profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || "",
        bannerOffset: profileData.bannerOffset || 50,
        stickers: profileData.stickers || [],
        customColors: profileData.customColors || {}
      });
      setIsDarkMode(profileData.theme === 'dark');
    }
  }, [profileData, user]);

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, {
        name: formData.name,
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        bannerOffset: formData.bannerOffset,
        stickers: formData.stickers,
        customColors: formData.customColors,
        theme: isDarkMode ? 'dark' : 'light',
        updatedAt: new Date().toISOString()
      });

      toast({ title: "Profile Synced", description: "Personalization saved." });
      setIsOptimizeModalOpen(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setFormData(prev => ({ ...prev, profilePic: base64 }));
      else if (type === 'banner') setFormData(prev => ({ ...prev, banner: base64 }));
    }
  };

  const addSticker = (url: string) => {
    const newSticker: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      url, 
      x: 50, 
      y: 30, 
      rotation: 0, 
      scale: 1
    };
    setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
    setSelectedStickerId(newSticker.id);
  };

  const updateStickerProperty = (id: string, property: keyof Sticker, value: number) => {
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === id ? { ...s, [property]: value } : s)
    }));
  };

  const removeSticker = (id: string) => {
    setFormData(prev => ({ ...prev, stickers: prev.stickers.filter(s => s.id !== id) }));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-8 w-8" />
    </div>
  );
  if (!user) return null;

  const headerColor = formData.customColors.header || "var(--primary)";
  const contrastHeader = getContrastColor(formData.customColors.header);

  const selectedSticker = formData.stickers.find(s => s.id === selectedStickerId);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative overflow-x-hidden flex flex-col" style={{ backgroundColor: formData.customColors.background || "var(--background)" }}>
      {/* Visual Sticker Layer (Static for Preview) */}
      <div className="absolute inset-0 pointer-events-none z-[60]">
        {formData.stickers.map((sticker) => (
          <div 
            key={sticker.id} 
            className="absolute" 
            style={{ 
              left: `${sticker.x}%`, 
              top: `${sticker.y}%`, 
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})` 
            }}
          >
            <div className={cn(
              "relative w-24 h-24",
              selectedStickerId === sticker.id && "ring-4 ring-primary ring-offset-2 rounded-xl"
            )}>
              <Image src={sticker.url} alt="sticker" fill className="object-contain" unoptimized />
            </div>
          </div>
        ))}
      </div>

      <div className="relative w-full shrink-0">
        <div className="h-16 w-full" style={{ backgroundColor: headerColor }} />
        <header className="absolute top-0 left-0 right-0 px-6 py-5 flex justify-between items-center z-50">
          <h1 className="text-2xl font-black uppercase tracking-tighter" style={{ color: contrastHeader }}>Sphere</h1>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Settings size={24} style={{ color: contrastHeader }} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-3xl p-2 border-2 bg-white/95 backdrop-blur-md">
              <DropdownMenuItem onClick={() => setIsOptimizeModalOpen(true)} className="rounded-2xl h-10 gap-3 cursor-pointer">
                <UserCog size={18} className="text-primary" />
                <span className="text-[10px] font-black uppercase">Optimize</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-2xl h-10 gap-3 text-secondary cursor-pointer">
                <LogOut size={18} />
                <span className="text-[10px] font-black uppercase">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="relative">
          <div className="h-56 w-full relative overflow-hidden">
            <Image src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} alt="banner" fill className="object-cover" style={{ objectPosition: `50% ${formData.bannerOffset}%` }} unoptimized />
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center relative z-20">
            <Avatar className="h-32 w-32 border-4 border-white bg-white shadow-2xl">
              <AvatarImage src={formData.profilePic} className="object-cover" />
              <AvatarFallback className="text-2xl font-black">{formData.name?.[0] || user.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="w-full relative mt-4">
        <div style={{ backgroundColor: formData.customColors.userInfo }} className="px-6 flex flex-col items-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ color: getContrastColor(formData.customColors.userInfo) }}>{formData.name || "Innovator"}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: getContrastColor(formData.customColors.userInfo) }}>@{profileData?.username || "user"}</p>
          <div className="p-6 rounded-[2.5rem] border w-full mt-6 shadow-xl" style={{ backgroundColor: formData.customColors.bioCard || "hsl(var(--card))" }}>
            <p className="text-center text-[12px] leading-relaxed font-bold italic" style={{ color: getContrastColor(formData.customColors.bioCard) }}>
              {formData.bio || "Innovating the future, one idea at a time."}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: formData.customColors.statsSection }} className="w-full py-10 px-10">
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>{dynamicPostCount}</p>
              <p className="text-[8px] uppercase font-black opacity-40">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>0</p>
              <p className="text-[8px] uppercase font-black opacity-40">Circle</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter" style={{ color: getContrastColor(formData.customColors.statsSection) }}>0</p>
              <p className="text-[8px] uppercase font-black opacity-40">Circling</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-10 space-y-6">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Your Innovations</span>
             <div className="flex-1 h-px bg-primary/10" />
          </div>
          
          <div className="space-y-8">
            {isPostsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : userPosts && userPosts.length > 0 ? (
              userPosts.map((post) => (
                <div key={post.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <IdeaCard idea={post as any} />
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 opacity-30">
                <LayoutGrid size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">No innovations published yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isOptimizeModalOpen} onOpenChange={setIsOptimizeModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
          <div className="p-6 border-b shrink-0 flex items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase text-primary">Optimize Profile</DialogTitle>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="text-primary w-5 h-5" /> : <Sun className="text-primary w-5 h-5" />}
                <p className="text-[10px] font-black uppercase">Dark Mode</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Palette size={14}/> Background Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {['#FF4500', '#FFD700', '#000000', '#FFFFFF', '#F5F5F5', '#8B4513', '#E0F2F1', '#F3E5F5'].map(color => (
                  <button key={color} className="h-8 w-8 rounded-full border shadow-sm" style={{ backgroundColor: color }} onClick={() => setFormData(p => ({ ...p, customColors: { ...p.customColors, background: color } }))} />
                ))}
              </div>
            </div>

            <div className="space-y-6 border-t pt-6">
              <Label className="text-[10px] font-black uppercase flex items-center gap-2"><StickerIcon size={14}/> Sticker Hub</Label>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {["rocket", "sparkles", "brain", "heart", "globe", "zap", "flame", "star"].map(n => (
                  <button key={n} className="shrink-0 w-20 h-20 rounded-[1.5rem] border-2 border-dashed p-2 hover:border-primary transition-all bg-muted/10 flex items-center justify-center" onClick={() => addSticker(`https://picsum.photos/seed/sticker-${n}/200/200`)}>
                    <Image src={`https://picsum.photos/seed/sticker-${n}/200/200`} alt="sticker" width={60} height={60} className="object-contain" unoptimized />
                  </button>
                ))}
              </div>

              {formData.stickers.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase">Active Stickers (Select to Edit)</Label>
                  <div className="flex flex-wrap gap-3">
                    {formData.stickers.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => setSelectedStickerId(s.id)} 
                        className={cn(
                          "relative h-14 w-14 border rounded-[1rem] p-1 bg-muted/10 transition-all",
                          selectedStickerId === s.id ? "border-primary ring-2 ring-primary/20 scale-110" : "border-border hover:border-primary/50"
                        )}
                      >
                        <Image src={s.url} alt="s" width={50} height={50} className="object-contain" unoptimized />
                        {selectedStickerId === s.id && (
                          <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5"><X size={10} onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }} /></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSticker && (
                <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-6 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase text-primary tracking-widest">Adjust Sticker</p>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStickerId(null)} className="h-6 px-2 text-[8px] uppercase">Deselect</Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[8px] font-black uppercase flex items-center gap-1"><Move size={10}/> Horizontal (X)</Label><span className="text-[8px] font-bold">{selectedSticker.x}%</span></div>
                      <Slider value={[selectedSticker.x]} max={100} step={1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'x', v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[8px] font-black uppercase flex items-center gap-1"><Move size={10}/> Vertical (Y)</Label><span className="text-[8px] font-bold">{selectedSticker.y}%</span></div>
                      <Slider value={[selectedSticker.y]} max={100} step={1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'y', v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[8px] font-black uppercase flex items-center gap-1"><Maximize2 size={10}/> Size (Scale)</Label><span className="text-[8px] font-bold">{selectedSticker.scale.toFixed(1)}x</span></div>
                      <Slider value={[selectedSticker.scale]} min={0.5} max={3} step={0.1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'scale', v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[8px] font-black uppercase flex items-center gap-1"><RotateCw size={10}/> Rotation</Label><span className="text-[8px] font-bold">{selectedSticker.rotation}°</span></div>
                      <Slider value={[selectedSticker.rotation]} min={0} max={360} step={1} onValueChange={([v]) => updateStickerProperty(selectedSticker.id, 'rotation', v)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-6">
              <Label className="text-[10px] font-black uppercase">Banner Image</Label>
              <div onClick={() => bannerInputRef.current?.click()} className="relative h-24 bg-muted rounded-2xl overflow-hidden border-2 border-dashed cursor-pointer hover:border-primary transition-all">
                {formData.banner ? <Image src={formData.banner} alt="banner" fill className="object-cover" unoptimized /> : <Camera className="absolute inset-0 m-auto opacity-10" size={32} />}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase">Bio</Label>
              <Textarea value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} placeholder="Your innovation story..." className="rounded-2xl min-h-[100px] text-sm font-medium" />
            </div>
          </div>
          <div className="p-6 border-t bg-white">
            <Button className="w-full h-14 rounded-3xl bg-primary text-white font-black uppercase shadow-xl" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Apply Transformations"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'banner')} />
    </div>
  );
}

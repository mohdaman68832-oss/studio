
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Loader2, Camera, Palette, Plus, Move, Maximize2, RotateCw, Image as ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CustomColors {
  header?: string;
  userInfo?: string;
  bioCard?: string;
  statsSection?: string;
  background?: string;
  textOutline?: string;
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

function getTextShadow(color: string | undefined) {
  if (!color) return "none";
  return `1px 1px 0 ${color}, -1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}, 0px 1px 0 ${color}, 0px -1px 0 ${color}, 1px 0px 0 ${color}, -1px 0px 0 ${color}`;
}

export default function ProfileEditPage() {
  const { user, loading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profilePic: "",
    banner: "",
    customColors: {
      header: "#FF4500",
      userInfo: "#FDF6F2",
      bioCard: "#FFFFFF",
      statsSection: "#FDF6F2",
      background: "#FDF6F2",
      textOutline: "transparent"
    } as CustomColors
  });

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || user?.displayName || "",
        bio: profileData.bio || "",
        profilePic: profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || "",
        customColors: {
          header: profileData.customColors?.header || "#FF4500",
          userInfo: profileData.customColors?.userInfo || "#FDF6F2",
          bioCard: profileData.customColors?.bioCard || "#FFFFFF",
          statsSection: profileData.customColors?.statsSection || "#FDF6F2",
          background: profileData.customColors?.background || "#FDF6F2",
          textOutline: profileData.customColors?.textOutline || "transparent"
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setFormData(prev => ({ ...prev, profilePic: base64 }));
      else if (type === 'banner') setFormData(prev => ({ ...prev, banner: base64 }));
    }
  };

  const updateColor = (key: keyof CustomColors, value: string) => {
    setFormData(prev => ({ ...prev, customColors: { ...prev.customColors, [key]: value } }));
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-8 w-8" />
    </div>
  );

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
        
        <div className="p-4 text-center">
           <h2 
             className="text-xl font-black uppercase transition-all duration-300" 
             style={{ textShadow: getTextShadow(formData.customColors.textOutline) }}
           >
             {formData.name || "Preview"}
           </h2>
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
      </div>
    </div>
  );
}

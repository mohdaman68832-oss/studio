
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Grid, Bookmark, Heart, LogOut, User, Bell, Shield, HelpCircle, Pencil, Save, X, Loader2, Camera, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
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
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacingSticker, setIsPlacingSticker] = useState(false);

  // Refs for image uploads
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profilePic: "",
    banner: "",
    stickers: [] as Sticker[]
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
        stickers: profileData.stickers || []
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
        const newSticker: Sticker = {
          id: Math.random().toString(36).substr(2, 9),
          url: url,
          x: 50, // Default to center
          y: 50
        };
        setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
        setIsPlacingSticker(true);
        toast({
          title: "Sticker Added",
          description: "Tap anywhere on your profile to reposition the sticker.",
        });
      }
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!isPlacingSticker || !profileContainerRef.current) return;

    const rect = profileContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setFormData(prev => {
      const updatedStickers = [...prev.stickers];
      if (updatedStickers.length > 0) {
        updatedStickers[updatedStickers.length - 1].x = x;
        updatedStickers[updatedStickers.length - 1].y = y;
      }
      return { ...prev, stickers: updatedStickers };
    });
    
    setIsPlacingSticker(false);
  };

  const removeSticker = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stickers: prev.stickers.filter(s => s.id !== id)
    }));
  };

  const handleSaveProfile = async () => {
    if (!user || !profileRef) return;
    setIsSaving(true);

    try {
      // Update Auth Profile
      await updateProfile(user, {
        displayName: formData.name,
        photoURL: formData.profilePic
      });

      // Update Firestore Profile
      await updateDoc(profileRef, {
        bio: formData.bio,
        profilePictureUrl: formData.profilePic,
        bannerUrl: formData.banner,
        stickers: formData.stickers,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      setIsEditModalOpen(false);
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

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-xs font-black uppercase tracking-widest text-primary">Initializing Sphere...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div 
      className="max-w-md mx-auto min-h-screen bg-background pt-6 pb-24 relative overflow-hidden" 
      ref={profileContainerRef}
      onClick={handleProfileClick}
    >
      {/* Stickers Layer */}
      {formData.stickers.map((sticker) => (
        <div 
          key={sticker.id}
          className="absolute z-40 pointer-events-none group"
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg">
            <Image 
              src={sticker.url} 
              alt="sticker" 
              fill 
              className="object-contain animate-in zoom-in duration-300" 
            />
            {isEditModalOpen && (
              <button 
                onClick={() => removeSticker(sticker.id)}
                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-md pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      ))}

      {isPlacingSticker && (
        <div className="fixed inset-0 z-[60] bg-primary/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 px-6 py-3 rounded-full shadow-2xl border-2 border-primary animate-bounce">
            <p className="text-xs font-black uppercase tracking-widest text-primary">Tap to place your sticker</p>
          </div>
        </div>
      )}

      <div className="px-6 flex justify-between items-center mb-6 relative z-10">
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Profile</h1>
        
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 transition-colors">
              <Settings size={22} className="text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] p-6 bg-background border-none shadow-2xl">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-center text-sm font-black uppercase tracking-widest">Settings</SheetTitle>
            </SheetHeader>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-14 rounded-2xl gap-4 hover:bg-primary/5"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsEditModalOpen(true);
                }}
              >
                <Pencil size={18} className="text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest">Edit Profile</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl gap-4 hover:bg-primary/5">
                <Bell size={18} className="text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest">Notifications</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="w-full justify-start h-14 rounded-2xl gap-4 text-secondary hover:bg-secondary/5 hover:text-secondary"
              >
                <LogOut size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-center">Customize Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Banner Edit */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Profile Banner</Label>
              <div 
                onClick={() => bannerInputRef.current?.click()}
                className="relative h-24 bg-muted rounded-2xl overflow-hidden group cursor-pointer border-2 border-dashed border-primary/20"
              >
                {formData.banner ? (
                  <Image src={formData.banner} alt="Banner" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon /></div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            </div>

            {/* Profile Pic Edit */}
            <div className="flex items-center gap-4">
               <div className="relative w-20 h-20 rounded-full bg-muted overflow-hidden group border-4 border-white shadow-md">
                 <Image src={formData.profilePic || `https://picsum.photos/seed/${user.uid}/200/200`} alt="Profile" fill className="object-cover" />
                 <button 
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <Camera className="text-white" size={16} />
                 </button>
               </div>
               <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Display Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl h-10 bg-muted/30 border-none"
                  />
               </div>
               <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Bio</Label>
              <Textarea 
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="rounded-2xl h-24 bg-muted/30 border-none resize-none text-xs"
                placeholder="Share your innovation mission..."
              />
            </div>

            {/* Sticker Management */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Screen Stickers</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-12 w-12 border-2 border-dashed border-primary/40 text-primary flex items-center justify-center"
                  onClick={() => stickerInputRef.current?.click()}
                >
                  <Plus size={20} />
                </Button>
                {formData.stickers.map(s => (
                  <div key={s.id} className="relative w-12 h-12 rounded-xl bg-muted border border-border p-1 group">
                    <Image src={s.url} alt="sticker thumb" fill className="object-contain p-1" />
                    <button 
                      onClick={() => removeSticker(s.id)}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 shadow-sm"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'sticker')} />
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center italic">Stickers can be dragged/placed on your main profile page</p>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 mt-4">
            <Button 
              variant="ghost" 
              className="flex-1 rounded-2xl h-12 uppercase font-black text-[10px] tracking-widest"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-2xl h-12 uppercase font-black text-[10px] tracking-widest bg-primary"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Profile Content */}
      <div className="relative z-10">
        <div className="relative h-48 w-full bg-muted overflow-hidden">
          <Image 
            src={formData.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} 
            alt="banner" 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
        </div>

        <div className="px-6 -mt-16 flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar className="h-32 w-32 border-[6px] border-white shadow-2xl">
              <AvatarImage src={formData.profilePic} />
              <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm"></div>
          </div>
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">{user.displayName || "Innovator"}</h2>
          <p className="text-sm font-bold text-primary mb-4 tracking-widest uppercase">@{profileData?.username || "user"}</p>
          <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/50 shadow-sm w-full">
            <p className="text-center text-xs text-muted-foreground leading-relaxed italic">
              {formData.bio || "Building the future of decentralized systems."}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 w-full py-8 my-2">
            <div className="text-center">
              <p className="text-xl font-black text-primary">{profileData?.totalIdeasPosted || 0}</p>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Ideas</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-xl font-black text-primary">{(profileData?.totalViewsReceived || 4200).toLocaleString()}</p>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Views</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-primary">{(profileData?.totalIdeasSaved || 856).toLocaleString()}</p>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Saves</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="my-ideas" className="w-full">
          <TabsList className="w-full bg-transparent border-b rounded-none px-6 mb-1 h-14">
            <TabsTrigger value="my-ideas" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all">
              <Grid size={22} />
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all">
              <Bookmark size={22} />
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex-1 rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all">
              <Heart size={22} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-ideas" className="px-1 mt-2">
            <div className="grid grid-cols-3 gap-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="aspect-square relative overflow-hidden group">
                  <Image 
                    src={`https://picsum.photos/seed/idea${user.uid}${i}/400/400`} 
                    alt="My idea" 
                    fill 
                    className="object-cover transition-transform group-hover:scale-110 duration-500" 
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="saved" className="px-6 py-20 text-center text-muted-foreground opacity-30">
            <Bookmark size={48} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No saved innovations yet</p>
          </TabsContent>
          <TabsContent value="liked" className="px-6 py-20 text-center text-muted-foreground opacity-30">
            <Heart size={48} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Liked ideas will appear here</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

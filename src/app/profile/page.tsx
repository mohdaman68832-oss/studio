
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Settings, LogOut, Loader2, Check, X, Camera, Image as ImageIcon, ShieldAlert, Video, Type
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, collection as fsCollection, query, where, orderBy, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { IdeaCard } from "@/components/feed/idea-card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [db, user]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [localProfile, setLocalProfile] = useState({
    name: "",
    bio: "",
    profilePic: "",
    banner: ""
  });

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileData) {
      setLocalProfile({
        name: profileData.name || user?.displayName || "Innovator",
        bio: profileData.bio || "Innovating the future...",
        profilePic: profileData.profilePictureUrl || user?.photoURL || "",
        banner: profileData.bannerUrl || ""
      });
    }
  }, [profileData, user]);

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

  const circlingQuery = useMemoFirebase(() => (db && user?.uid ? query(fsCollection(db, "follows"), where("followerId", "==", user.uid)) : null), [db, user.uid]);
  const circleQuery = useMemoFirebase(() => (db && user?.uid ? query(fsCollection(db, "follows"), where("followedId", "==", user.uid)) : null), [db, user.uid]);
  
  const { data: circlingData } = useCollection(circlingQuery);
  const { data: circleData } = useCollection(circleQuery);

  const handleSave = async () => {
    if (!profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, {
        name: localProfile.name,
        bio: localProfile.bio,
        profilePictureUrl: localProfile.profilePic,
        bannerUrl: localProfile.banner,
        updatedAt: serverTimestamp()
      });
      setIsEditMode(false);
      toast({ title: "Profile Locked", description: "All changes have been saved." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed", description: "Try again later." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      if (type === 'profile') setLocalProfile(p => ({ ...p, profilePic: base64 }));
      else if (type === 'banner') setLocalProfile(p => ({ ...p, banner: base64 }));
    }
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-8 w-8" />
    </div>
  );
  if (!user) return null;

  const filteredPosts = (type: string) => {
    if (!userPosts) return [];
    return userPosts.filter(p => p.mediaType === type);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative overflow-x-hidden flex flex-col bg-background">
      <div className="relative w-full shrink-0 z-10">
        <div className="h-16 w-full bg-primary" />
        <header className="absolute top-0 left-0 right-0 px-6 py-5 flex justify-between items-center z-[100]">
          {isEditMode ? (
             <Button variant="ghost" size="icon" onClick={() => setIsEditMode(false)} className="rounded-full bg-black/20 backdrop-blur-md">
               <X size={24} className="text-white" />
             </Button>
          ) : (
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Sphere</h1>
          )}
          
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <Link href="/admin/reports">
                <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-md rounded-full h-10 w-10">
                  <ShieldAlert size={20} className="text-white" />
                </Button>
              </Link>
            )}
            
            {isEditMode ? (
              <Button onClick={handleSave} disabled={isSaving} className="rounded-full h-10 px-6 bg-white text-primary font-black uppercase text-[10px] tracking-widest shadow-xl">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} className="mr-2" /> Save All</>}
              </Button>
            ) : (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><Settings size={24} className="text-white" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-3xl p-2 border-2 bg-white/95 backdrop-blur-md min-w-[180px]">
                  <DropdownMenuItem onClick={() => setIsEditMode(true)} className="rounded-2xl h-10 gap-3 cursor-pointer">
                    <Settings size={18} className="text-primary" />
                    <span className="text-[10px] font-black uppercase">Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-2xl h-10 gap-3 text-secondary cursor-pointer">
                    <LogOut size={18} />
                    <span className="text-[10px] font-black uppercase">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <div className="relative">
          <div className="h-56 w-full relative overflow-hidden group">
            <Image 
              src={localProfile.banner || `https://picsum.photos/seed/banner${user.uid}/800/400`} 
              alt="banner" 
              fill 
              className="object-cover" 
              unoptimized 
            />
            {isEditMode && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10" onClick={() => bannerInputRef.current?.click()}>
                <Camera size={32} className="text-white" />
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
              </div>
            )}
          </div>
          <div className="px-6 -mt-16 flex flex-col items-center relative z-20">
            <div className="relative group">
              <Avatar className={cn(
                "h-32 w-32 border-4 border-white bg-white shadow-lg transition-all duration-500",
                profileData?.isOnline && "shadow-[0_15px_30px_rgba(255,69,0,0.5)] shadow-primary/50 border-primary"
              )}>
                <AvatarImage src={localProfile.profilePic} className="object-cover" />
                <AvatarFallback className="text-2xl font-black">{localProfile.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              {isEditMode && (
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                  <Camera size={24} className="text-white" />
                  <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full relative mt-4 z-40">
        <div className="px-6 flex flex-col items-center relative">
          <div className="relative flex flex-col items-center w-full">
            {isEditMode ? (
              <div className="w-full space-y-6 pt-4 animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Innovator Name</Label>
                  <input value={localProfile.name} onChange={e => setLocalProfile(p => ({ ...p, name: e.target.value }))} className="w-full text-center font-black uppercase text-xl h-14 rounded-2xl border-primary/20 bg-white/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner" placeholder="Your Name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Mission Statement (Bio)</Label>
                  <Textarea value={localProfile.bio} onChange={e => setLocalProfile(p => ({ ...p, bio: e.target.value }))} className="text-center font-medium text-xs rounded-2xl border-primary/20 min-h-[100px] bg-white/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner p-4" placeholder="What are you building?" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 text-foreground">
                  {localProfile.name}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                  @{profileData?.username || "user"}
                </p>
              </div>
            )}
          </div>
          
          {!isEditMode && (
            <div className="p-6 rounded-[2.5rem] border bg-white w-full mt-6 shadow-xl border-primary/5 relative z-20">
              <p className="text-center text-[12px] leading-relaxed font-bold italic text-foreground">
                {localProfile.bio}
              </p>
            </div>
          )}
        </div>

        <div className="relative z-10">
          <div className="w-full py-10 px-10 relative">
            <div className="grid grid-cols-3 gap-6 w-full">
              <div className="text-center">
                <p className="text-xl font-black tracking-tighter text-foreground">{dynamicPostCount}</p>
                <p className="text-[8px] uppercase font-black opacity-40">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black tracking-tighter text-foreground">{circleData?.length || 0}</p>
                <p className="text-[8px] uppercase font-black opacity-40">Circle</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black tracking-tighter text-foreground">{circlingData?.length || 0}</p>
                <p className="text-[8px] uppercase font-black opacity-40">Circling</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-10 space-y-8 relative bg-background">
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="w-full h-14 bg-muted/30 rounded-full p-1 mb-8">
                <TabsTrigger value="image" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ImageIcon size={14} /> Images
                </TabsTrigger>
                <TabsTrigger value="video" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Video size={14} /> Videos
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Type size={14} /> Ideas
                </TabsTrigger>
              </TabsList>

              {["image", "video", "text"].map((type) => (
                <TabsContent key={type} value={type} className="outline-none space-y-8">
                  {isPostsLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                  ) : filteredPosts(type).length > 0 ? (
                    filteredPosts(type).map((post) => (
                      <div key={post.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <IdeaCard idea={post as any} isProfileView={true} />
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4 opacity-30">
                      <p className="text-[10px] font-black uppercase tracking-widest">No {type} posts found</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

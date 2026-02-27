
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, Search, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc } from "firebase/firestore";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();

  // Fetch real-time profile data for the bottom nav avatar
  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData } = useDoc(profileRef);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (!user || isAuthPage) return null;

  const navItems = [
    { label: "Feed", icon: Home, href: "/" },
    { label: "Search", icon: Search, href: "/search" },
    { label: "Post", icon: PlusSquare, href: "/post" },
    { label: "Chat", icon: MessageCircle, href: "/chat" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  // Prioritize the Firestore profile picture URL, fallback to Auth photo, then empty
  const profilePic = profileData?.profilePictureUrl || user?.photoURL || "";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] border-t bottom-nav-blur h-16 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isProfile = item.label === "Profile";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-200",
                isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className="relative flex flex-col items-center">
                {isProfile ? (
                  <Avatar className={cn(
                    "h-8 w-8 border-2 transition-all duration-300 shadow-sm",
                    isActive ? "border-primary scale-110 shadow-md ring-2 ring-primary/20" : "border-transparent"
                  )}>
                    <AvatarImage src={profilePic} className="object-cover" />
                    <AvatarFallback className="text-[10px] font-black uppercase bg-primary/10 text-primary">
                      {user?.displayName?.[0] || profileData?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon size={24} className={cn(isActive && "fill-current opacity-20")} />
                )}
              </div>
              <span className={cn(
                "text-[9px] mt-1 font-black uppercase tracking-widest",
                isActive ? "text-primary" : "text-muted-foreground/60"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

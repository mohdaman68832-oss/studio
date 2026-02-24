
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, Search, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Feed", icon: Home, href: "/" },
    { label: "Search", icon: Search, href: "/search" },
    { label: "Post", icon: PlusSquare, href: "/post" },
    { label: "Chat", icon: MessageCircle, href: "/chat" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bottom-nav-blur h-16 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-200",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon size={24} className={cn(isActive && "fill-current opacity-20")} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

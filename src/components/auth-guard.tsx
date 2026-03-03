'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * Recreated Image-based Logo Loader (Minimal Edition)
 * Features: Stylized M-Chat-Bubble and Moving Tiny Eyes.
 * Clutter removed as per request.
 */
function LogoLoader() {
  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Character Body - Refined 'M' Chat Bubble Shape */}
        <div className="relative z-10 animate-bubble-sway">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* The main 'M' Chat Bubble Character Shape */}
            <path 
              d="M25 115 L5 135 V110 C5 30 20 15 40 15 C55 15 65 25 70 45 C75 25 85 15 100 15 C120 15 135 30 135 110 C135 125 120 130 100 130 H25 Z" 
              fill="#FF4500" 
            />

            {/* Moving and Blinking Tiny Eyes */}
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                <circle cx="45" cy="70" r="1.5" fill="white" />
                <circle cx="95" cy="70" r="1.5" fill="white" />
              </g>
            </g>
            
            {/* Top-right Floating Accent Dot */}
            <circle cx="125" cy="20" r="6" fill="#FF4500" className="animate-pulse" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isSetupPage = pathname === '/setup';

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      if (!isAuthPage) {
        router.push('/login');
      }
    } else {
      if (!profileData && !isProfileLoading) {
        if (!isSetupPage) {
          router.push('/setup');
        }
      } else if (profileData) {
        if (isAuthPage || isSetupPage) {
          router.push('/');
        }
      }
    }
  }, [user, isUserLoading, isProfileLoading, profileData, isAuthPage, isSetupPage, router]);

  const shouldShowChildren = () => {
    if (isUserLoading || isProfileLoading) return false;
    if (!user) return isAuthPage;
    if (!profileData) return isSetupPage;
    return !isAuthPage && !isSetupPage;
  };

  if (!shouldShowChildren()) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background overflow-hidden">
        <LogoLoader />
      </div>
    );
  }

  return <>{children}</>;
}

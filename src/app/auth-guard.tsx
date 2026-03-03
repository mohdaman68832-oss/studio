'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * Recreated Image-based Logo Loader
 * Features: M-Chat-Bubble, Rotating Orbital Ring, and Tiny Eyes.
 */
function LogoLoader() {
  return (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Orbital Ring - Elliptical rotation around the logo */}
        <div className="absolute inset-0 z-0 animate-ring-rotate">
           <svg width="100%" height="100%" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
             <ellipse cx="80" cy="80" rx="75" ry="25" stroke="#FF4500" strokeWidth="6" transform="rotate(-25 80 80)" />
           </svg>
        </div>

        {/* Character Body - Stylized 'M' Chat Bubble */}
        <div className="relative z-10 animate-bubble-sway">
          <svg width="120" height="120" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* The main 'M' Chat Bubble Shape */}
            <path 
              d="M30 110 L10 135 V40 C10 20 25 10 45 10 C65 10 70 25 70 45 C70 25 75 10 95 10 C115 10 130 20 130 40 V110 C130 125 115 130 100 130 H30 Z" 
              fill="#FF4500" 
            />

            {/* Moving and Blinking Eyes */}
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                <circle cx="45" cy="55" r="2.5" fill="white" />
                <circle cx="95" cy="55" r="2.5" fill="white" />
              </g>
            </g>
            
            {/* Top-right Accent Dot from image */}
            <circle cx="130" cy="15" r="7" fill="#FF4500" className="animate-pulse" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">
          Launching Sphere
        </p>
        <div className="h-0.5 w-12 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-progress-fast" />
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

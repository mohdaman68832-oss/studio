
'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * Animated Logo Loader Component
 * Custom: 'm' bubble is smaller, eyes are larger, sways left-to-right.
 */
function LogoLoader() {
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Main 'm' Speech Bubble with Horizontal Swaying animation */}
        <div className="relative z-10 animate-bubble-sway">
          <svg width="110" height="110" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* The 'm' Shape stylized as a speech bubble */}
            <path 
              d="M20 40C20 28.9543 28.9543 20 40 20H80C91.0457 20 100 28.9543 100 40V70C100 81.0457 91.0457 90 80 90H45L20 105V40Z" 
              fill="#FF4500" 
            />
            
            {/* Eyes Group with Look Around & Blink animations - Larger Eyes */}
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                {/* Blinking Eyes (Enlarged Rectangles) */}
                <rect x="42" y="42" width="10" height="22" rx="5" fill="white" />
                <rect x="68" y="42" width="10" height="22" rx="5" fill="white" />
              </g>
            </g>
            
            {/* Top Right Dot */}
            <circle cx="105" cy="15" r="8" fill="#FF4500" />
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

/**
 * AuthGuard handles the global authentication flow.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, "userProfiles", user.uid) : null), [user, db]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isSetupPage = pathname === '/setup';

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user) {
        if (!profileData && !isSetupPage && !isAuthPage) {
          router.push('/setup');
        } else if (profileData && (isAuthPage || isSetupPage)) {
          router.push('/');
        }
      }
    }
  }, [user, isUserLoading, isProfileLoading, profileData, isAuthPage, isSetupPage, router]);

  // Premium Animated Loading State
  if ((isUserLoading || (user && isProfileLoading)) && !isAuthPage && !isSetupPage) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background overflow-hidden">
        <LogoLoader />
      </div>
    );
  }

  return <>{children}</>;
}

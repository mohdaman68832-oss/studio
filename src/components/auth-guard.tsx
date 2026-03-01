
'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * Animated Logo Loader Component
 * Refined: Larger eyes, Left-to-Right Horizontal Swaying.
 */
function LogoLoader() {
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Main 'm' Speech Bubble with Horizontal Swaying animation - Scaled down for compact look */}
        <div className="relative z-10 animate-bubble-sway scale-75">
          <svg width="110" height="110" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* The 'm' Shape stylized as a speech bubble */}
            <path 
              d="M20 40C20 28.9543 28.9543 20 40 20H80C91.0457 20 100 28.9543 100 40V70C100 81.0457 91.0457 90 80 90H45L20 105V40Z" 
              fill="#FF4500" 
            />
            
            {/* Eyes Group with Look Around & Blink animations - Larger, more expressive eyes */}
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                {/* Blinking Eyes (Enlarged Rectangles) */}
                <rect x="38" y="38" width="14" height="30" rx="7" fill="white" />
                <rect x="68" y="38" width="14" height="30" rx="7" fill="white" />
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
 * AuthGuard handles the global authentication flow and ensures users don't see pages they shouldn't.
 */
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
    // If we're still loading the user state or profile, don't do anything yet.
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      // Not logged in: Redirect to login unless already on auth page.
      if (!isAuthPage) {
        router.push('/login');
      }
    } else {
      // Logged in:
      if (!profileData) {
        // No profile: Redirect to setup unless already there.
        if (!isSetupPage) {
          router.push('/setup');
        }
      } else {
        // Profile exists: Redirect away from setup or auth pages back home.
        if (isAuthPage || isSetupPage) {
          router.push('/');
        }
      }
    }
  }, [user, isUserLoading, isProfileLoading, profileData, isAuthPage, isSetupPage, router]);

  // Determine if we should show the children or the loader.
  // We only show children if we are on a page that matches the current auth state.
  const shouldShowChildren = () => {
    if (isUserLoading || isProfileLoading) return false;
    
    if (!user) {
      return isAuthPage;
    }
    
    // User is logged in
    if (!profileData) {
      return isSetupPage;
    }
    
    // User has profile
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

'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * Animated Logo Loader Component
 * Reverted to the compact 'm' bubble shape with energetic eyes.
 */
function LogoLoader() {
  return (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Stylized 'M' Bubble Character - Compact Shape */}
        <div className="relative z-10 animate-bubble-sway">
          <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stylized 'M' Bubble Character Path */}
            <path 
              d="M20 70 C20 95 40 100 60 100 C80 100 100 95 100 70 V50 C100 25 85 15 72 15 C65 15 62 20 60 30 C58 20 55 15 48 15 C35 15 20 25 20 50 V70 Z" 
              fill="#FF4500" 
            />

            {/* Moving and Blinking Eyes - Reverted Size */}
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                <circle cx="42" cy="52" r="2.5" fill="white" />
                <circle cx="78" cy="52" r="2.5" fill="white" />
              </g>
            </g>
            
            {/* Floating Accent Dot */}
            <circle cx="108" cy="18" r="6" fill="#FF4500" className="animate-pulse" />
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
    // Wait for auth loading before deciding routing.
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


'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * Animated Logo Loader Component
 * Refined Tiny Elegant Eyes with horizontal sway.
 */
function LogoLoader() {
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="relative z-10 animate-bubble-sway scale-75">
          <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M20 40C20 28.9543 28.9543 20 40 20H80C91.0457 20 100 28.9543 100 40V70C100 81.0457 91.0457 90 80 90H45L20 105V40Z" 
              fill="#FF4500" 
            />
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                {/* Tiny Elegant Balanced Eyes */}
                <rect x="53" y="58" width="2" height="4" rx="1" fill="white" />
                <rect x="65" y="58" width="2" height="4" rx="1" fill="white" />
              </g>
            </g>
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

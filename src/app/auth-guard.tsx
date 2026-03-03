'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * Animated Logo Loader Component
 * Custom 'm' bubble logo with orbital ring and moving eyes.
 */
function LogoLoader() {
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Orbital Ring Container */}
        <div className="absolute inset-0 animate-ring-rotate flex items-center justify-center">
           <svg width="120" height="120" viewBox="0 0 120 120">
             <ellipse 
               cx="60" cy="60" rx="55" ry="18" 
               stroke="#FF4500" strokeWidth="4" fill="none" 
               className="opacity-90"
               style={{ transform: 'rotate(-15deg)', transformOrigin: 'center' }}
             />
           </svg>
        </div>

        {/* M-Bubble Logo */}
        <div className="relative z-10 animate-bubble-sway scale-90">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* The Dot at top-right */}
            <circle cx="108" cy="12" r="7" fill="#FF4500" className="animate-pulse" />
            
            {/* The Stylized 'M' Chat Bubble Path */}
            <path 
              d="M25 90 L12 108 V75 C12 50 32 30 48 30 C56 30 61 35 63 45 C65 35 70 30 78 30 C95 30 112 50 112 75 V90 H92 V75 C92 60 85 50 78 50 C72 50 68 60 68 75 V90 H48 V75 C48 60 42 50 35 50 C30 50 25 60 25 75 V90 Z" 
              fill="#FF4500" 
            />

            {/* Moving Eyes inside the humps */}
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                <rect x="42" y="60" width="2.5" height="5" rx="1.25" fill="white" />
                <rect x="74" y="60" width="2.5" height="5" rx="1.25" fill="white" />
              </g>
            </g>
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
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
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Orbital Ring Container */}
        <div className="absolute inset-0 animate-ring-rotate flex items-center justify-center pointer-events-none">
           <svg width="140" height="140" viewBox="0 0 140 140" className="opacity-40">
             <ellipse 
               cx="70" cy="70" rx="65" ry="15" 
               stroke="#FF4500" strokeWidth="3" fill="none" 
               style={{ transform: 'rotate(-20deg)', transformOrigin: 'center' }}
             />
           </svg>
        </div>

        {/* M-Bubble Logo */}
        <div className="relative z-10 animate-bubble-sway">
          <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stylized 'M' Chat Bubble Path - Balanced & Elegant */}
            <path 
              d="M25 85 L12 105 V70 C12 45 30 30 45 30 C53 30 58 35 60 45 C62 35 67 30 75 30 C90 30 108 45 108 70 V85 H90 V70 C90 60 85 50 78 50 C72 50 68 60 68 70 V85 H48 V70 C48 60 42 50 35 50 C30 50 25 60 25 70 V85 Z" 
              fill="#FF4500" 
            />

            {/* Moving Eyes inside the humps */}
            <g className="animate-eye-look">
              <g className="animate-eye-blink">
                <circle cx="40" cy="62" r="2.5" fill="white" />
                <circle cx="72" cy="62" r="2.5" fill="white" />
              </g>
            </g>
            
            {/* Top Right Floating Accent Dot */}
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

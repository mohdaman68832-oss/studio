
'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * AuthGuard handles the global authentication flow.
 * Redirects unauthenticated users to /login.
 * Redirects authenticated users with no profile to /setup.
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
    if (!isUserLoading && !isProfileLoading) {
      if (!user && !isAuthPage) {
        // Not logged in -> login
        router.push('/login');
      } else if (user) {
        if (!profileData && !isSetupPage && !isAuthPage) {
          // Logged in but no profile -> setup
          router.push('/setup');
        } else if (profileData && (isAuthPage || isSetupPage)) {
          // Logged in and has profile -> home
          router.push('/');
        }
      }
    }
  }, [user, isUserLoading, isProfileLoading, profileData, isAuthPage, isSetupPage, router]);

  // Loading state
  if ((isUserLoading || (user && isProfileLoading)) && !isAuthPage && !isSetupPage) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background/50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-progress-fast" />
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/40">
            Syncing Identity...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

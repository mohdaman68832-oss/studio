
'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * AuthGuard handles the global authentication flow.
 * Redirects unauthenticated users to /login and authenticated users away from auth pages.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!isUserLoading) {
      if (!user && !isAuthPage) {
        // User not logged in, trying to access a protected page
        router.push('/login');
      } else if (user && isAuthPage) {
        // User logged in, trying to access login/signup page
        router.push('/');
      }
    }
  }, [user, isUserLoading, isAuthPage, router]);

  // Fast loading state that doesn't block the UI with a full initializing screen
  if (isUserLoading && !isAuthPage) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background/50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-progress-fast" />
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/40">
            Syncing...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

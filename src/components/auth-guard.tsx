'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * AuthGuard handles the global authentication flow.
 * - Redirects unauthenticated users to /login if they try to access protected routes.
 * - Redirects authenticated users to / (home) if they try to access /login or /signup.
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

  // Show a clean loading state while checking authentication
  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="h-8 w-8 bg-primary/20 rounded-full" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 animate-bounce">
            Initializing Sphere
          </p>
        </div>
      </div>
    );
  }

  // If not loading, render the actual content
  return <>{children}</>;
}


'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { Loader2, ShieldAlert } from 'lucide-react';

function LogoLoader() {
  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in duration-700">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
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
      // Ban Check
      if (profileData?.isBanned) {
        return; // Stay on ban screen
      }

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

  if (profileData?.isBanned) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-10 text-center space-y-6">
        <div className="bg-destructive/10 p-8 rounded-full border-4 border-destructive/20 animate-pulse">
          <ShieldAlert size={80} className="text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Access Terminated</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Sphere Violation Detected</p>
        </div>
        <p className="text-sm font-bold text-foreground leading-relaxed max-w-xs">
          Your account ID ({user?.uid}) has been permanently restricted for violating innovation community guidelines.
        </p>
        <div className="pt-8 border-t w-full opacity-30">
          <p className="text-[8px] font-black uppercase">Ref ID: SEC-TERMINATED-LOG</p>
        </div>
      </div>
    );
  }

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

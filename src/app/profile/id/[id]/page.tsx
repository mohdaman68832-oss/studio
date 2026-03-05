
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

/**
 * Helper route to resolve a User UID to their Profile Username.
 * This is useful for Admin links where we only have the target UID.
 */
export default function ProfileIdResolverPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const userId = params.id as string;

  const profileRef = useMemoFirebase(() => (db && userId ? doc(db, "userProfiles", userId) : null), [db, userId]);
  const { data: profile, isLoading, error } = useDoc(profileRef);

  useEffect(() => {
    if (!isLoading && profile?.username) {
      router.replace(`/profile/${profile.username}`);
    }
  }, [profile, isLoading, router]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-10 text-center gap-4">
        <p className="text-sm font-black uppercase text-destructive">Innovator Profile Not Found</p>
        <p className="text-[10px] text-muted-foreground uppercase">The profile may have been deleted or the ID is invalid.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Resolving Identity...</p>
    </div>
  );
}

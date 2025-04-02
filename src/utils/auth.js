"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export function withAuth(Component, requireAdmin = false) {
  return function ProtectedPage(props) {
    const router = useRouter();
    const { user, loadingUser } = useMagicLink();

    const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    useEffect(() => {
      if (!loadingUser) {
        if (!user) {
          router.replace("/");
        } else if (requireAdmin && !isAdmin) {
          router.replace("/dashboard");
        }
      }
    }, [user, loadingUser, router, isAdmin]);

    if (loadingUser || !user) {
      return <div className="loading">Loading...</div>;
    }

    if (requireAdmin && !isAdmin) {
      return null;
    }

    return <Component {...props} isAdmin={isAdmin} />;
  };
}

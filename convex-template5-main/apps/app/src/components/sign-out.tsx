"use client";

import { performLogout } from "@/lib/logout";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";

export function SignOut() {
  const { signOut } = useAuthActions();

  const handleSignOut = async () => {
    await performLogout({
      signOut,
      timeoutMs: 3500,
      redirectTo: "/login",
    });
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="outline"
      className="font-mono gap-2 flex items-center"
    >
      <Icons.SignOut className="size-4" />
      <span>Sign out</span>
    </Button>
  );
}

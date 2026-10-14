"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  allowedRoles: Array<"owner" | "admin" | "member">;
  children: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  allowedRoles,
  children,
  redirectTo = "/my-portal",
}: RoleGuardProps) {
  const router = useRouter();
  const { workspaces, current } = useWorkspace();

  const currentWorkspace = workspaces.find((w) => w._id === current);
  const currentRole = currentWorkspace?.role as
    | "owner"
    | "admin"
    | "member"
    | undefined;

  // We are loaded when workspace data is available and role is known
  const isLoaded =
    workspaces.length > 0 && current !== null && currentRole !== undefined;
  const isAuthorized = currentRole ? allowedRoles.includes(currentRole) : false;

  useEffect(() => {
    if (isLoaded && !isAuthorized) {
      router.replace(redirectTo);
    }
  }, [isLoaded, isAuthorized, router, redirectTo]);

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold text-primary">
          Access Restricted
        </h2>
        <p className="text-sm text-primary/60">
          You do not have permission to view this page. Redirecting to your
          portal...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

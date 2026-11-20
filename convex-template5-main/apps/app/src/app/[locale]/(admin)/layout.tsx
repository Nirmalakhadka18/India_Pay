import { WorkspaceProvider } from "@/lib/workspace-provider";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@v1/backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { CommandPalette } from "../(dashboard)/_components/command-palette";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  let user = null;
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return redirect("/login");
    }
    user = await fetchQuery(api.users.getUser, {}, { token });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return redirect("/login?expired=1");
  }

  if (!user) {
    return redirect("/login");
  }
  if (!user.username) {
    return redirect("/onboarding");
  }

  return (
    <WorkspaceProvider>
      <div className="min-h-screen w-full bg-white dark:bg-black">
        {children}
      </div>
      <Toaster richColors position="top-right" />
      <CommandPalette />
    </WorkspaceProvider>
  );
}

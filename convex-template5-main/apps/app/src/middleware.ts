import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { createI18nMiddleware } from "next-international/middleware";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr", "es"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

const isSignInPage = createRouteMatcher([
  "/login",
  "/:locale/login",
  "/(.*)/login",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isSignIn = isSignInPage(request);
  const isExpired =
    request.nextUrl.searchParams.has("expired") ||
    request.nextUrl.searchParams.has("force");

  // If redirecting to login with expired=1, strip the stale cookies and show the login page
  if (isSignIn && isExpired) {
    const response = I18nMiddleware(request);
    const host = request.headers.get("Host") ?? "";
    const isLocalhost =
      host.includes("localhost") || host.includes("127.0.0.1");
    const prefix = isLocalhost ? "" : "__Host-";
    response.cookies.delete(prefix + "__convexAuthJWT");
    response.cookies.delete(prefix + "__convexAuthRefreshToken");
    response.cookies.delete(prefix + "__convexAuthOAuthVerifier");
    return response;
  }

  const isAuthenticated = await convexAuth.isAuthenticated();
  if (isSignIn && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/");
  }
  if (!isSignIn && !isAuthenticated) {
    const redirectResponse = nextjsMiddlewareRedirect(request, "/login");
    redirectResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    redirectResponse.headers.set("Pragma", "no-cache");
    redirectResponse.headers.set("Expires", "0");
    return redirectResponse;
  }

  const response = I18nMiddleware(request);
  if (response && !isSignIn) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",

    // all routes except static assets
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};

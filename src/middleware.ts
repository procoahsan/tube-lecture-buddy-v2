import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ["/dashboard", "/interests", "/clip"];
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected) {
    // Check for NextAuth / AuthJS session cookies
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      // Not logged in -> Redirect to login page with callbackUrl parameter for seamless redirect-back!
      const callbackUrl = pathname + request.nextUrl.search;
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
      
      // Add a friendly prompt message
      loginUrl.searchParams.set("message", "Please sign in to access this feature.");
      
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow access
  return NextResponse.next();
}

// Optimize middleware to only run on relevant app routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interests/:path*",
    "/clip/:path*",
  ],
};

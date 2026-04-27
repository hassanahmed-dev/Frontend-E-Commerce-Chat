import { NextRequest, NextResponse } from "next/server";

const adminRoutes = ["/admin", "/dashboard", "/products", "/bulk-upload", "/chat"];
const userRoutes = ["/shop", "/wishlist", "/cart", "/checkout", "/account", "/product"];
const authRoutes = ["/login", "/signup"];

function hasPrefix(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("shopnest_token")?.value;
  const role = request.cookies.get("shopnest_role")?.value as "admin" | "user" | undefined;
  const isAuthenticated = Boolean(token && role);

  const isAdminRoute = hasPrefix(pathname, adminRoutes);
  const isUserRoute = hasPrefix(pathname, userRoutes);
  const isAuthRoute = hasPrefix(pathname, authRoutes);

  if (pathname === "/" && role === "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAdminRoute) {
    if (!isAuthenticated) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/shop", request.url));
    }
  }

  if (isUserRoute && role === "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(role === "admin" ? "/dashboard" : "/shop", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};


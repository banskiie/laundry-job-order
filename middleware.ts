import { JWT } from "next-auth/jwt"
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { IUser } from "./types/user.interface"
import { Role } from "./types/user.interface"

const routePermissions = [
  {
    path: "/dashboard",
    allowedRoles: [Role.ADMIN],
  },
  {
    path: "/users",
    allowedRoles: [Role.ADMIN],
  },
  {
    path: "/payments",
    allowedRoles: [Role.ADMIN],
  },
  {
    path: "/orders",
    allowedRoles: [Role.ADMIN],
  },
]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const TOKEN = req.nextauth.token as JWT & { user?: IUser }
    const ROLE = TOKEN?.user?.role as Role

    // Helper function to check route permissions
    const isAuthorized = (path: string, role: Role) =>
      routePermissions.some(
        (route) =>
          path.startsWith(route.path) && route.allowedRoles.includes(role)
      )

    // Redirect authenticated users from `/` to `/dashboard`
    if (pathname === "/" && TOKEN) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Block unauthenticated users from accessing protected routes
    if (!TOKEN && pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Check if user has permission to access the route
    if (TOKEN && !isAuthorized(pathname, ROLE)) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Authorization is handled manually
    },
  }
)

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/approval/:path*",
    "/branch/:path*",
    "/department/:path*",
    "/dashboard/:path*",
    "/endorsement/:path*",
    "/history/:path*",
    "/log/:path*",
    "/request/:path*",
    "/user/:path*",
    "/vehicle/:path*",
  ],
}

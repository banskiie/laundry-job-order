import { JWT } from "next-auth/jwt"
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { IUser } from "./types/user.interface"
import { Role } from "./types/user.interface"

const routePermissions = [
  {
    path: "/users",
    allowedRoles: [Role.ADMIN],
  },
  {
    path: "/payments",
    allowedRoles: [Role.ADMIN, Role.CASHIER],
  },
  {
    path: "/orders",
    allowedRoles: [Role.ADMIN, Role.CASHIER, Role.STAFF],
  },
  {
    path: "/settings",
    allowedRoles: [Role.ADMIN, Role.CASHIER, Role.STAFF],
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

    // Redirect authenticated users from `/` to `/orders`
    if (pathname === "/" && TOKEN) {
      return NextResponse.redirect(new URL("/orders", req.url))
    }

    // Block unauthenticated users from accessing protected routes
    if (!TOKEN && pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Check if user has permission to access the route
    if (TOKEN && !isAuthorized(pathname, ROLE)) {
      return NextResponse.redirect(new URL("/orders", req.url))
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
    "/users/:path*",
    "/orders/:path*",
    "/payments/:path*",
    "/settings/:path*",
  ],
}

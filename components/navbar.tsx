"use client"
import Link from "next/link"
import React from "react"
import { Button } from "./ui/button"
import { Notebook, PhilippinePeso, Settings, Users } from "lucide-react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Role } from "@/types/user.interface"
import { usePathname } from "next/navigation"

const NAVBAR_ITEMS = [
  {
    name: "Orders",
    href: "/orders",
    icon: Notebook,
    allowedRoles: [Role.ADMIN, Role.CASHIER, Role.STAFF],
  },
  {
    name: "Payments",
    href: "/payments",
    icon: PhilippinePeso,
    allowedRoles: [Role.ADMIN, Role.CASHIER],
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    allowedRoles: [Role.ADMIN],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    allowedRoles: [Role.ADMIN, Role.CASHIER, Role.STAFF],
  },
]

const Navbar = () => {
  const session: any = useSession()
  const role = session?.data?.user?.role
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "bg-slate-50 h-18 grid",
        (() => {
          switch (role) {
            case Role.ADMIN:
              return "grid-cols-4"
            case Role.CASHIER:
              return "grid-cols-3"
            case Role.STAFF:
              return "grid-cols-2"
            default:
              return "grid-cols-1"
          }
        })(),
        "place-items-center border-t"
      )}
    >
      {NAVBAR_ITEMS.filter((item) => item.allowedRoles.includes(role)).map(
        (item) => (
          <Link href={item.href} className="w-full h-full" key={item.name}>
            <Button
              variant="ghost"
              size="icon-lg"
              className={cn(
                "h-full rounded-none w-full hover:bg-slate-100 hover:cursor-pointer flex flex-col pt-2",
                pathname === item.href &&
                  "bg-primary text-white hover:bg-primary hover:text-white"
              )}
            >
              {item.icon && <item.icon className="size-8" />}
              <span className="-mt-2">{item.name}</span>
            </Button>
          </Link>
        )
      )}
      {/* <Link href="/orders" className="w-full h-full">
        <Button
          variant="ghost"
          size="icon-lg"
          className="h-full rounded-none w-full hover:bg-slate-100 hover:cursor-pointer flex flex-col -space-y-2 pt-2"
        >
          <Notebook className="size-8" />
          <span>Orders</span>
        </Button>
      </Link>
      <Link href="/payments" className="w-full h-full">
        <Button
          variant="ghost"
          size="icon-lg"
          className="h-full rounded-none w-full hover:bg-slate-100 hover:cursor-pointer flex flex-col -space-y-2 pt-2"
        >
          <PhilippinePeso className="size-8" />
          <span>Payments</span>
        </Button>
      </Link>
      <Link href="/users" className="w-full h-full">
        <Button
          variant="ghost"
          size="icon-lg"
          className="h-full rounded-none w-full hover:bg-slate-100 hover:cursor-pointer flex flex-col -space-y-2 pt-2"
        >
          <Users className="size-8" />
          <span>Users</span>
        </Button>
      </Link>
      <Link href="/settings" className="w-full h-full">
        <Button
          variant="ghost"
          size="icon-lg"
          className="h-full rounded-none w-full hover:bg-slate-100 hover:cursor-pointer flex flex-col -space-y-2 pt-2"
        >
          <Settings className="size-8" />
          <span>Settings</span>
        </Button>
      </Link> */}
    </div>
  )
}

export default Navbar

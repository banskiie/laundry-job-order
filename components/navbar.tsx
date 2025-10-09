"use client"
import Link from "next/link"
import React from "react"
import { Button } from "./ui/button"
import { Notebook, PhilippinePeso, Settings, Users } from "lucide-react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const Navbar = () => {
  const session: any = useSession()
  const role = session?.data?.user?.role

  return (
    <div
      className={cn(
        "bg-slate-50 h-18 grid",
        (() => {
          switch (role) {
            case "ADMIN":
              return "grid-cols-4"
            case "CASHIER":
              return "grid-cols-3"
            case "STAFF":
              return "grid-cols-2"
            default:
              return "grid-cols-1"
          }
        })(),
        "place-items-center border-t"
      )}
    >
      <Link href="/orders" className="w-full h-full">
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
      </Link>
    </div>
  )
}

export default Navbar

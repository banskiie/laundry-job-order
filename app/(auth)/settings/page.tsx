"use client"
import { Button } from "@/components/ui/button"
import { Separator } from "@radix-ui/react-separator"
import { signOut, useSession } from "next-auth/react"
import React from "react"

const Page = () => {
  const session: any = useSession()
  const user = session?.data?.user
  return (
    <div className="flex flex-col p-2">
      <Button
        className="rounded-none text-left p-0"
        variant="link"
        size="lg"
        onClick={() => signOut()}
      >
        <span className="w-full text-left">Export</span>
      </Button>
      <Separator />
      <Button
        className="rounded-none text-left p-0"
        variant="link"
        size="lg"
        onClick={() => signOut()}
      >
        <span className="w-full text-left">Sign Out</span>
      </Button>
      <div className="flex flex-col">
        <span className="text-muted-foreground text-sm">User Details</span>
        <span className="text-muted-foreground text-sm">
          User: <span className="font-medium">{user?.name}</span>
        </span>
        <span className="text-muted-foreground text-sm">
          Username: <span className="font-medium">{user?.username}</span>
        </span>
        <span className="text-muted-foreground text-sm">
          Role: <span className="font-medium">{user?.role}</span>
        </span>
      </div>
    </div>
  )
}

export default Page

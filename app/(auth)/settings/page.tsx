"use client"
import { Button } from "@/components/ui/button"
import { Separator } from "@radix-ui/react-separator"
import { signOut, useSession } from "next-auth/react"
import React from "react"
import ChangePasswordDialog from "./dialogs/change-password"

const Page = () => {
  const session: any = useSession()
  const user = session?.data?.user
  return (
    <div className="flex flex-col p-2 gap-2">
      <ChangePasswordDialog />
      <Separator />
      <Button
        variant="outline"
        className="bg-destructive/5 border-destructive text-destructive hover:bg-destructive/15 hover:text-destructive"
        size="lg"
        onClick={() => signOut()}
      >
        Sign Out
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

"use client"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import React from "react"

const Page = () => {
  const session = useSession()
  const user = session?.data?.user
  return (
    <div className="flex flex-col">
      <Button
        className="rounded-none text-left"
        size="lg"
        onClick={() => signOut()}
      >
        Sign Out
      </Button>
    </div>
  )
}

export default Page

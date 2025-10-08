"use client"
import { Button } from "@/components/ui/button"
import React from "react"
import { signOut, useSession } from "next-auth/react"
import { IUser } from "@/types/user.interface"

const Page = () => {
  const { data }: any & { user: IUser } = useSession()
  return (
    <div>
      <span>Session: {data?.user?.role}</span>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  )
}

export default Page

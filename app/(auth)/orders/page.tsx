"use client"
import { Button } from "@/components/ui/button"
import React from "react"
import { signOut } from "next-auth/react"

const Page = () => {
  return (
    <div>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  )
}

export default Page

"use client"
import { useSession } from "next-auth/react"
import React from "react"

const Page = () => {
  const session = useSession()
  const user = session?.data?.user
  return <div>{user?.name}</div>
}

export default Page

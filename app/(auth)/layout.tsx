"use client"
import Header from "@/components/header"
import Navbar from "@/components/navbar"

const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <main className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">{children}</div>
      <Navbar />
    </main>
  )
}

export default AuthLayout

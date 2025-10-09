import React from "react"
import LogoImage from "@/public/images/icon.png"
import Image from "next/image"

const Header = () => {
  return (
    <div className="bg-slate-50 w-full flex items-center justify-center p-3 border-b">
      <Image src={LogoImage} className="h-10 object-contain" alt="Logo" />
    </div>
  )
}

export default Header

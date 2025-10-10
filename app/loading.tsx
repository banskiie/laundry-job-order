import { Loader } from "lucide-react"
import React from "react"

const Loading = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Loader className="animate-spin absolute size-18" />
    </div>
  )
}

export default Loading

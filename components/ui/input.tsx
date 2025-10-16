import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Eye, EyeOff } from "lucide-react"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="w-full flex">
      <input
        type={type === "password" ? (showPassword ? "text" : "password") : type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          type === "password" && "rounded-r-none",
          className
        )}
        {...props}
      />
      {type === "password" && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setShowPassword(!showPassword)}
          className={cn(
            "rounded-l-none",
            props["aria-invalid"] && "border-destructive text-destructive"
          )}
        >
          {showPassword ? <Eye /> : <EyeOff />}
        </Button>
      )}
    </div>
  )
}

export { Input }

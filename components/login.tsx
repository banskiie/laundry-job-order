"use client"
import { useTransition } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import LogoImage from "@/public/images/logo.png"
import Image from "next/image"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Shirt } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogFooter,
} from "./ui/alert-dialog"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const LoginSchema = z.object({
  username: z.string().nonempty("Username is required"),
  password: z.string().nonempty("Password is required"),
})

function ForgotPasswordDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link">Forgot Password?</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Forgot Password?</AlertDialogTitle>
          <AlertDialogDescription>
            Contact{" "}
            <span className="text-destructive font-medium underline">
              NATS Department
            </span>{" "}
            for help.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const Login = () => {
  const [isPending, startTransition] = useTransition()
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })
  const router = useRouter()

  const onSubmit = (payload: z.infer<typeof LoginSchema>) =>
    startTransition(async () => {
      try {
        const response = await signIn("credentials", {
          ...payload,
          redirect: false,
          callbackUrl: "/orders",
        })
        if (response?.ok) {
          router.push(response.url || "/orders")
        }
        if (response?.error) {
          throw new Error(response.error)
        }
      } catch (error: any) {
        console.error(error)
        form.setError("username", {
          type: "manual",
        })
        form.setError("password", {
          type: "manual",
          message: error?.message,
        })
      }
    })

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="max-w-96 flex flex-col gap-2 items-center">
        <div className="flex flex-col items-center py-[12%] -mt-[12%]">
          <Image src={LogoImage} alt="System Logo" />
          <div className="flex items-center gap-2">
            <Shirt className="size-4" />
            <span className="text-xl font-bold drop-shadow ">
              Laundry Job Order System
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-80">
          <Form {...form}>
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="@username"
                          {...field}
                          onChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          disabled={isPending}
                          placeholder="•••••••"
                        />
                      </FormControl>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Button loading={isPending} className="mt-2">
                  Sign In
                </Button>
                <ForgotPasswordDialog />
              </div>
            </form>
          </Form>
        </div>
      </div>
      <span className="absolute bottom-0 text-sm text-muted-foreground mb-3">
        © 2025 C-ONE Development Team 💻
      </span>
    </div>
  )
}

export default Login

"use client"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Role } from "@/types/user.interface"
import { gql } from "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CirclePlus } from "lucide-react"
import React, { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const CREATE_USER = gql`
  mutation Create($input: CreateUserInput!) {
    createUser(input: $input) {
      ok
      message
    }
  }
`

const UPDATE_USER = gql`
  mutation Update($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ok
      message
    }
  }
`
const RESET_PASSWORD = gql`
  mutation ResetPassword($_id: ID!) {
    resetPassword(_id: $_id) {
      ok
      message
    }
  }
`

const USER = gql`
  query User($_id: ID!) {
    user(_id: $_id) {
      _id
      name
      username
      role
    }
  }
`

const ResetPasswordWarning = ({
  _id,
  onClose,
}: {
  _id?: string
  onClose: () => void
}) => {
  const [openWarning, setOpenWarning] = useState<boolean>(false)
  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD, {
    variables: { _id },
  })

  const onCompleted = () => {
    setOpenWarning(false)
    onClose()
  }

  return (
    <AlertDialog open={openWarning} onOpenChange={setOpenWarning}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-blue-700 text-blue-700 hover:bg-blue-700/10 hover:text-blue-700"
          type="button"
        >
          Reset Password
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will reset the user&apos;s password to their{" "}
            <span className="font-medium text-blue-700 underline">
              username
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenWarning(false)}>
            Cancel
          </AlertDialogCancel>
          <Button
            className="bg-blue-700 hover:bg-blue-700/90"
            loading={loading}
            onClick={async () =>
              await resetPassword().then((data: any) => {
                const message = data.data?.resetPassword?.message
                if (message) toast.success(message)
                onCompleted()
              })
            }
          >
            Yes, reset password
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const UserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  role: z.enum(Object.values(Role), "Select a valid role"),
})

const DEFAULT_VALUES = {
  name: "",
  username: "",
  role: "STAFF" as Role,
}

const UserForm = ({
  children,
  _id,
  refetch,
}: Readonly<{
  children?: React.ReactNode
  _id?: string
  refetch: () => void
}>) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const form = useForm<z.infer<typeof UserSchema>>({
    resolver: zodResolver(UserSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const [submit] = useMutation(_id ? UPDATE_USER : CREATE_USER)
  const { data } = useQuery(USER, {
    skip: !_id,
    variables: { _id },
    fetchPolicy: "network-only",
  })

  useEffect(() => {
    if (open) {
      if (_id) { 
        const user = (data as any)?.user
        form.reset({
          name: user?.name || "",
          username: user?.username || "",
          role: (user?.role as Role) || Role.STAFF,
        })
      } else form.reset(DEFAULT_VALUES)
    }
  }, [open, form, data, _id])

  const onClose = () => {
    form.reset(DEFAULT_VALUES)
    setOpen(false)
    refetch?.()
  }

  const onSubmit = (data: z.infer<typeof UserSchema>) =>
    startTransition(async () => {
      const res = await submit({
        variables: {
          input: { ...(_id ? { _id } : {}), ...data },
        },
      })
      if (res) {
        onClose()
        const data = res.data as any
        const message = _id ? data.updateUser.message : data.createUser.message
        if (message) toast.success(message)
      }
    })

  return (
    <Sheet open={open} onOpenChange={setOpen} modal>
      <SheetTrigger asChild>
        {children || (
          <Button className="w-full">
            <CirclePlus /> New User
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="min-w-full"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>Job User Form</SheetTitle>
              <SheetDescription>
                Fill out the form below to create a new job user.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-2 flex flex-col gap-4 flex-1 overflow-y-auto max-h-[100%]">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Name"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Username"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(Role).map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
              <Button loading={isPending} type="submit">
                Submit
              </Button>
              <ResetPasswordWarning _id={_id} onClose={onClose} />
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default UserForm

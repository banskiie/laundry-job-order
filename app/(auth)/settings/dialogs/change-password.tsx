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
import { useSession } from "next-auth/react"
import React, { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($_id: ID!, $newPassword: String!) {
    changePassword(_id: $_id, newPassword: $newPassword) {
      ok
      message
    }
  }
`

const ChangePasswordDialog = () => {
  const { data }: any = useSession()
  const user = data?.user
  const [open, setOpen] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()
  const [newPassword, setNewPassword] = useState<string>("")
  const [submit] = useMutation(CHANGE_PASSWORD, {
    variables: { _id: user?._id, newPassword },
  })

  const onSubmit = () =>
    startTransition(async () => {
      const res: any = await submit()
      if (res) {
        toast.success(res.data.changePassword.message)
        setOpen(false)
      }
    })

  return (
    <Sheet open={open} onOpenChange={setOpen} modal>
      <SheetTrigger asChild>
        <Button className="w-full">Change Password</Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="min-w-full"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Change Password</SheetTitle>
          <SheetDescription>Please enter your new password.</SheetDescription>
        </SheetHeader>
        <div className="px-2 pb-2">
          <Input
            placeholder="New Password"
            disabled={isPending}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <SheetFooter>
          <Button loading={isPending} onClick={onSubmit} type="submit">
            Submit
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default ChangePasswordDialog

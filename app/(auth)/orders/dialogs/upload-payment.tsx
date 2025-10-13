"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { PaymentMethod } from "@/types/payment.interface"
import { gql } from "@apollo/client"
import { useMutation } from "@apollo/client/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload } from "lucide-react"
import Image from "next/image"
import React, { useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const UPLOAD_PAYMENT = gql`
  mutation UploadPayment($input: UploadPaymentInput!) {
    uploadPayment(input: $input) {
      ok
      message
    }
  }
`

const UploadPaymentSchema = z.object({
  paymentMethod: z
    .enum(Object.values(PaymentMethod))
    .nonoptional("Payment method is required"),
  amountPaid: z
    .number("Amount must be a number")
    .min(1, "Amount must be at least 1"),
  datePaid: z.date("Invalid date"),
  isFullyPaid: z.boolean().optional(),
})

const DEFAULT_VALUES = {
  paymentMethod: PaymentMethod.CASH,
  amountPaid: 1,
  datePaid: new Date(),
  isFullyPaid: false,
}

const UploadPaymentForm = ({
  _id,
  refetch,
}: {
  _id: string
  refetch?: () => void
}) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const form = useForm<z.infer<typeof UploadPaymentSchema>>({
    resolver: zodResolver(UploadPaymentSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const [submit] = useMutation(UPLOAD_PAYMENT)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5 MB")
        if (imageRef.current) {
          imageRef.current.value = ""
        }
        setImageFile(null)
        return
      }
      setImageFile(selectedFile)
    }
  }

  const onClose = () => {
    form.reset(DEFAULT_VALUES)
    form.clearErrors()
    setImageFile(null)
    setOpen(false)
    refetch?.()
  }

  const onUpload = async () => {
    if (!imageFile) return
    try {
      const formData = new FormData()
      formData.append("image", imageFile, imageFile.name) // Add file name
      const response = await fetch("/api/upload/payment", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      return data
    } catch (error) {
      throw new Error("Error uploading image: " + error)
    }
  }

  const onSubmit = (data: z.infer<typeof UploadPaymentSchema>) =>
    startTransition(async () => {
      try {
        const response = await onUpload()
        if (response?.url) {
          const res = await submit({
            variables: {
              input: {
                ...data,
                order: _id,
                proofOfPaymentURL: response.url,
              },
            },
          })
          if (res) {
            onClose()
            const message = (res.data as any)?.uploadPayment?.message
            if (message) toast.success(message)
          }
        }
      } catch (error) {
        console.error(error)
      }
    })

  return (
    <Sheet open={open} onOpenChange={setOpen} modal>
      <SheetTrigger asChild>
        <Button className="w-full">
          <Upload /> Upload Payment
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="min-w-full" showCloseButton={false}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>Upload Payment</SheetTitle>
              <SheetDescription>
                Fill out the form below to upload a payment.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-2 flex flex-col gap-4 flex-1 overflow-y-auto max-h-[100%]">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <Select
                        value={Boolean(field.value) ? field.value : undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(PaymentMethod).map((method) => (
                              <SelectItem key={method} value={method}>
                                {method.replace("_", " ")}
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
              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Paid Amount"
                        type="number"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                        value={+field.value}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="datePaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Paid</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Date Paid"
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value).toISOString().slice(0, 10)
                            : new Date().toISOString().slice(0, 10)
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFullyPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-3 border p-2 rounded-lg">
                        <Checkbox
                          id="fully-paid"
                          checked={field.value}
                          onCheckedChange={(checked: boolean) =>
                            field.onChange(checked)
                          }
                          className="size-4.5"
                        />
                        <div className="grid gap-1 leading-none">
                          <FormLabel htmlFor="fully-paid">
                            Is this fully paid?
                          </FormLabel>
                          <p className="text-muted-foreground text-sm">
                            Checking this will verify the order.
                          </p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2">
                <Label>Proof of Payment Slip</Label>
                <Input
                  type="file"
                  accept="image/*"
                  ref={imageRef}
                  onChange={handleImageChange}
                  disabled={isPending}
                  capture="environment"
                />
                {imageFile && (
                  <div className="flex flex-col gap-2 bg-slate-300 p-2">
                    <Image
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            <SheetFooter>
              <Button loading={isPending} type="submit">
                Submit
              </Button>
              <SheetClose asChild>
                <Button type="button" onClick={onClose} variant="outline">
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

export default UploadPaymentForm

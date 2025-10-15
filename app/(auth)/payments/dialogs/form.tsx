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
import { Separator } from "@/components/ui/separator"
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
import { IPayment, PaymentMethod } from "@/types/payment.interface"
import { gql } from "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Upload } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState, useTransition } from "react"
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

const UPDATE_PAYMENT = gql`
  mutation UpdatePayment($input: UpdatePaymentInput!) {
    updatePayment(input: $input) {
      ok
      message
    }
  }
`

const PAYMENT = gql`
  query Payment($_id: ID!) {
    payment(_id: $_id) {
      _id
      proofOfPaymentURL
      paymentMethod
      amountPaid
      datePaid
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
  onCloseParent,
}: {
  _id: string
  refetch?: () => void
  onCloseParent?: () => void
}) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const form = useForm<z.infer<typeof UploadPaymentSchema>>({
    resolver: zodResolver(UploadPaymentSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const [submit] = useMutation(_id ? UPDATE_PAYMENT : UPLOAD_PAYMENT)
  const { data } = useQuery(PAYMENT, {
    skip: !_id || !open,
    variables: { _id },
  })
  const payment = (data as any)?.payment as IPayment

  useEffect(() => {
    if (open) {
      if (_id) {
        form.reset({
          paymentMethod: payment?.paymentMethod || PaymentMethod.CASH,
          amountPaid: payment?.amountPaid || 0,
          datePaid: payment?.datePaid
            ? new Date(payment?.datePaid)
            : new Date(),
          isFullyPaid: payment?.isFullyPaid || false,
        })
      } else form.reset(DEFAULT_VALUES)
    }
  }, [open, form, data, _id, payment])

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
    if (imageRef.current) imageRef.current.value = ""
    setOpen(false)
    refetch?.()
    onCloseParent?.()
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
        const uploadResponse = await onUpload()
        const response = await submit({
          variables: {
            input: {
              ...(_id ? { _id, ...data } : data),
              ...(payment?.proofOfPaymentURL
                ? { proofOfPaymentURL: payment?.proofOfPaymentURL }
                : uploadResponse.url
                ? { proofOfPaymentURL: uploadResponse.url }
                : {}),
            },
          },
        })
        if (response) {
          onClose()
          const message = (response.data as any)?.createOrder?.message
          if (message) toast.success(message)
        }
      } catch (error) {
        console.error(error)
      }
    })

  return (
    <Sheet open={open} onOpenChange={setOpen} modal>
      <SheetTrigger asChild>
        <Button className="w-full">Edit Payment</Button>
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
                        type="datetime-local"
                        value={
                          field.value
                            ? format(
                                new Date(field.value),
                                "yyyy-MM-dd'T'HH:mm"
                              )
                            : format(new Date(), "yyyy-MM-dd'T'HH:mm")
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
                {_id && (
                  <span className="text-sm text-muted-foreground">
                    Upload new proof of payment slip to replace the current one.
                  </span>
                )}
                {imageFile && (
                  <div className="flex flex-col gap-2">
                    {_id && (
                      <>
                        <Separator />
                        <Label>New Proof of Payment Slip</Label>
                      </>
                    )}

                    <div className="flex flex-col gap-2 bg-slate-300 p-2">
                      <Image
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
                  </div>
                )}
                {payment?.proofOfPaymentURL && (
                  <div className="flex flex-col gap-2">
                    <Separator />
                    <Label>Current Proof of Payment</Label>
                    <div className="flex flex-col gap-2 bg-slate-300 p-2">
                      <Image
                        src={payment.proofOfPaymentURL}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
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

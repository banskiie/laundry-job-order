"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
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
import { cn } from "@/lib/utils"
import { IPayment, PaymentMethod } from "@/types/payment.interface"
import { gql } from "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import Image from "next/image"
import React, { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

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
  proofOfPaymentURL: z.union([z.string().url(), z.literal("")]),
})

const DEFAULT_VALUES = {
  paymentMethod: PaymentMethod.CASH,
  amountPaid: 0,
  datePaid: new Date(),
  proofOfPaymentURL: "",
}

const UpdatePaymentForm = ({
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
  const [submit] = useMutation(UPDATE_PAYMENT)
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
          proofOfPaymentURL: payment?.proofOfPaymentURL || "",
        })
      } else form.reset(DEFAULT_VALUES)
    }
  }, [open, form, _id, payment])

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
    form.clearErrors("proofOfPaymentURL")
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
        if (
          data.paymentMethod !== PaymentMethod.SALARY_DEDUCTION &&
          !uploadResponse?.url &&
          !data?.proofOfPaymentURL
        ) {
          form.setError("proofOfPaymentURL", {
            type: "manual",
            message: "Proof of payment is required for non-salary deduction.",
          })
          return
        }
        const res = await submit({
          variables: {
            input: {
              ...data,
              ...(uploadResponse?.url
                ? { proofOfPaymentURL: uploadResponse.url }
                : {}),
              _id: payment?._id,
              order: payment?.order?._id,
            },
          },
        })
        if (res) {
          onClose()
          const message = (res.data as any)?.uploadPayment?.message
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
                        disabled={isPending}
                        value={Boolean(field.value) ? field.value : undefined}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value === PaymentMethod.SALARY_DEDUCTION) {
                            form.setValue("proofOfPaymentURL", "")
                            form.clearErrors("proofOfPaymentURL")
                            if (imageRef.current) imageRef.current.value = ""
                            setImageFile(null)
                          }
                        }}
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
                      <div className="flex gap-1">
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
                        <Button
                          type="button"
                          onClick={() => field.onChange(new Date())}
                          disabled={isPending}
                        >
                          Now
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("paymentMethod") !==
                PaymentMethod.SALARY_DEDUCTION && (
                <div className="flex flex-col gap-2">
                  <Label>Proof of Payment Slip</Label>
                  <Input
                    type="file"
                    accept="image/jpeg, image/png"
                    ref={imageRef}
                    onChange={handleImageChange}
                    disabled={isPending}
                    capture="environment"
                    className={cn({
                      "border-destructive":
                        !!form.formState.errors.proofOfPaymentURL,
                    })}
                  />
                  {_id && (
                    <span className="text-sm text-muted-foreground">
                      Upload new proof of payment slip to replace the current
                      one.
                    </span>
                  )}
                  <FormDescription>
                    (Max size: 5 MB, Accepted formats: JPG, PNG).
                  </FormDescription>
                  {form.formState.errors.proofOfPaymentURL && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.proofOfPaymentURL.message}
                    </p>
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
              )}
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

export default UpdatePaymentForm

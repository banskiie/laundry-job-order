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
import { PaymentMethod } from "@/types/payment.interface"
import { gql } from "@apollo/client"
import { useMutation } from "@apollo/client/react"
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

const UploadPaymentSchema = z.object({
  paymentMethod: z
    .enum(Object.values(PaymentMethod))
    .nonoptional("Payment method is required"),
  amountPaid: z
    .number("Amount must be a number")
    .min(0, "Amount must be at least 0"),
  datePaid: z.date("Invalid date"),
  proofOfPaymentURL: z.union([z.string().url(), z.literal("")]),
  isFullyPaid: z.boolean().optional(),
})

const DEFAULT_VALUES = {
  paymentMethod: PaymentMethod.CASH,
  amountPaid: 0,
  datePaid: new Date(),
  isFullyPaid: true,
  proofOfPaymentURL: "",
}

const UploadPaymentForm = ({
  _id,
  onCloseParent,
}: {
  _id: string
  onCloseParent?: () => void
}) => {
  const [openUpload, setOpenUpload] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const form = useForm<z.infer<typeof UploadPaymentSchema>>({
    resolver: zodResolver(UploadPaymentSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const [submit] = useMutation(UPLOAD_PAYMENT)

  useEffect(() => {
    if (openUpload) form.reset(DEFAULT_VALUES)
  }, [openUpload, form])

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
    setOpenUpload(false)
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
              order: _id,
              ...(uploadResponse?.url
                ? { proofOfPaymentURL: uploadResponse.url }
                : {}),
            },
          },
        })
        if (res) {
          onClose()
          onCloseParent?.()
          const message = (res.data as any)?.uploadPayment?.message
          if (message) toast.success(message)
        }
      } catch (error) {
        console.error(error)
      }
    })

  return (
    <Sheet open={openUpload} onOpenChange={setOpenUpload} modal>
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
                        disabled={isPending}
                        value={Boolean(field.value) ? field.value : undefined}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value === PaymentMethod.SALARY_DEDUCTION)
                            form.setValue("proofOfPaymentURL", "")
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
                          onCheckedChange={(checked: boolean) => {
                            field.onChange(checked)
                            // If fully paid, set amountPaid to 0 (remaining balance)
                            form.setValue("amountPaid", checked ? 0 : 1)
                          }}
                          className="size-4.5"
                        />
                        <div className="grid gap-1 leading-none">
                          <FormLabel htmlFor="fully-paid">
                            Fully paid?
                          </FormLabel>
                          <p className="text-muted-foreground text-sm">
                            Checking this will{" "}
                            <span className="underline">
                              fully pay the remaining/total balance
                            </span>{" "}
                            of this order and mark this as{" "}
                            <span className="font-semibold text-blue-800">
                              verified
                            </span>
                            .
                          </p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Only fill this if the payment is not fully paid. Leave it */}
              {form.watch("isFullyPaid") == false && (
                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
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
                      <FormDescription>
                        Please enter the amount paid by the customer.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
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
                  <FormDescription>
                    (Max size: 5 MB, Accepted formats: JPG, PNG).
                  </FormDescription>
                  {form.formState.errors.proofOfPaymentURL && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.proofOfPaymentURL.message}
                    </p>
                  )}
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

export default UploadPaymentForm

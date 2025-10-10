"use client"
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { gql } from "@apollo/client"
import { useMutation } from "@apollo/client/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CirclePlus } from "lucide-react"
import Image from "next/image"
import React, { useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import z from "zod"

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      ok
      message
    }
  }
`

const OrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  amountToBePaid: z
    .number("Amount must be a number")
    .min(0, "Amount must be at least 0"),
  dateReceived: z.date("Invalid date"),
})

const OrderForm = ({ refetch }: { refetch?: () => void }) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const form = useForm<z.infer<typeof OrderSchema>>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      customerName: "",
      amountToBePaid: 0,
      dateReceived: new Date(),
    },
  })
  const [submit] = useMutation(CREATE_ORDER)

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

  const onUpload = async () => {
    if (!imageFile) return
    try {
      const formData = new FormData()
      formData.append("image", imageFile, imageFile.name) // Add file name
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      return data
    } catch (error) {
      throw new Error("Error uploading image: " + error)
    }
  }

  const onSubmit = (data: z.infer<typeof OrderSchema>) =>
    startTransition(async () => {
      const response = await onUpload()
      if (response?.url) {
        const res = await submit({
          variables: {
            input: {
              ...data,
              orderSlipURL: response.url,
            },
          },
        })
        if (res) {
          form.reset()
          setImageFile(null)
          setOpen(false)
          refetch?.()
        }
      }
    })

  return (
    <Sheet open={open} onOpenChange={setOpen} modal>
      <SheetTrigger asChild>
        <Button className="w-full">
          <CirclePlus /> New Job Order
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="min-w-full" showCloseButton={false}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>Job Order Form</SheetTitle>
              <SheetDescription>
                Fill out the form below to create a new job order.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-2 flex flex-col gap-4 flex-1 overflow-y-auto max-h-[100%]">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Customer Name"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountToBePaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to be Paid</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Amount to be Paid"
                        type="number"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
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
                name="dateReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Received</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Date Received"
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
              <div className="flex flex-col gap-2">
                <Label>Order Slip</Label>
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

export default OrderForm

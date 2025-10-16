import { Button } from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import Image from "next/image"
import { useState } from "react"
import UpdatePaymentForm from "./form"
import { useSession } from "next-auth/react"
import { IUser } from "@/types/user.interface"

const PAYMENT = gql`
  query Payment($_id: ID!) {
    payment(_id: $_id) {
      _id
      proofOfPaymentURL
      paymentMethod
      amountPaid
      datePaid
      order {
        customerName
      }
    }
  }
`

const ViewPayment = ({
  children,
  _id,
  refetch,
}: Readonly<{
  children: React.ReactNode
  _id?: string
  refetch: () => void
}>) => {
  const { data: sessionData } = useSession()
  const isAdmin = (sessionData?.user as IUser)?.role === "ADMIN"
  const isCashier = (sessionData?.user as IUser)?.role === "CASHIER"
  const [openView, setOpenView] = useState<boolean>(false)
  const {
    data,
    loading,
    refetch: refreshData,
  } = useQuery(PAYMENT, {
    skip: !_id,
    variables: { _id },
    fetchPolicy: "network-only",
  })

  const showEdit = isAdmin || isCashier

  const handleOpenChange = (isOpen: boolean) => {
    setOpenView(isOpen)
    if (isOpen && _id) {
      refreshData()
    }
  }

  const payment = (data as any)?.payment
  if (loading) return <Skeleton className="h-[98px] w-full rounded-none" />

  const onClose = () => {
    setOpenView(false)
    refetch()
  }

  return (
    <Sheet open={openView} onOpenChange={handleOpenChange} modal>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        side="left"
        className="min-w-full"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>View Payment</SheetTitle>
            <SheetDescription>
              View the details of the payment below.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-2 grid grid-cols-2 gap-2.5 items-start place-content-start flex-1 overflow-y-auto max-h-[100%]">
            <div className="grid gap-1 col-span-2">
              <Label>Customer Name</Label>
              <span>{payment?.order?.customerName}</span>
            </div>
            <div className="grid gap-1 col-span-2">
              <Label>Payment Method</Label>
              <span className="capitalize">
                {payment?.paymentMethod.replaceAll("_", " ").toLowerCase()}
              </span>
            </div>
            <div className="grid gap-1 col-span-2">
              <Label>Amount </Label>
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PHP",
                }).format(payment?.amountPaid)}
              </span>
            </div>
            {payment?.proofOfPaymentURL && (
              <div className="grid gap-1 col-span-2">
                <Label>Proof of Payment</Label>
                <Image
                  src={payment?.proofOfPaymentURL}
                  alt="Payment Slip"
                  width={500}
                  height={500}
                  className="w-full max-w-md h-auto object-contain"
                  priority
                  fetchPriority="high"
                  loading="eager"
                />
              </div>
            )}
          </div>
          <SheetFooter>
            {showEdit && (
              <UpdatePaymentForm _id={payment?._id} onCloseParent={onClose} />
            )}
            <SheetClose asChild>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ViewPayment

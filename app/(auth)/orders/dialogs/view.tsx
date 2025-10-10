import StatusBadge from "@/components/status-badge"
import { Button } from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"
import { gql } from "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { OrderStatus } from "@/types/order.interface"
import { useState } from "react"

const ORDER = gql`
  query Order($_id: ID!) {
    order(_id: $_id) {
      _id
      customerName
      orderSlipURL
      amountToBePaid
      orderStatuses {
        status
        date
        by {
          name
        }
      }
      createdAt
      updatedAt
    }
  }
`

const READY_TO_PAY = gql`
  mutation ReadyToPayOrder($_id: ID!) {
    readyToPayOrder(_id: $_id) {
      ok
      message
    }
  }
`

const ReadyToPayWarning = ({
  _id,
  onClose,
}: {
  _id?: string
  onClose: () => void
}) => {
  const [openReadyToPay, setOpenReadyToPay] = useState<boolean>(false)
  const [readyToPayOrder, { data, loading }] = useMutation(READY_TO_PAY)

  const onCompleted = () => {
    setOpenReadyToPay(false)
    onClose()
  }

  return (
    <AlertDialog open={openReadyToPay} onOpenChange={setOpenReadyToPay}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Ready to Pay</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You will set this order as{" "}
            <span className="font-medium text-destructive underline">
              ready for payment
            </span>{" "}
            and be sent to the cashier.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCompleted}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            loading={loading}
            onClick={async () =>
              await readyToPayOrder({ variables: { _id } }).then(() =>
                onCompleted()
              )
            }
          >
            Submit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const ViewOrder = ({
  children,
  _id,
  refetch,
}: Readonly<{
  children: React.ReactNode
  _id?: string
  refetch: () => void
}>) => {
  const [openView, setOpenView] = useState<boolean>(false)
  const { data, loading } = useQuery(ORDER, { skip: !_id, variables: { _id } })
  const order = (data as any)?.order
  if (loading) return <Skeleton className="h-25.5 w-full rounded-none" />

  const onClose = () => {
    setOpenView(false)
    refetch()
  }

  return (
    <Sheet open={openView} onOpenChange={setOpenView} modal>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        side="left"
        className="min-w-full"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>View Job Order</SheetTitle>
            <SheetDescription>
              View the details of the job order below.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-2 flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[100%]">
            <div className="grid gap-1">
              <Label>Current Status</Label>
              <StatusBadge
                status={
                  order?.orderStatuses[order?.orderStatuses.length - 1]?.status
                }
              />
            </div>
            <div className="grid gap-1">
              <Label>Customer Name</Label>
              <span>{order?.customerName}</span>
            </div>
            <div className="grid gap-1">
              <Label>Amount </Label>
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PHP",
                }).format(order?.amountToBePaid)}
              </span>
            </div>
            <div className="grid gap-1">
              <Label>Job Order Slip</Label>
              <Image
                src={order?.orderSlipURL}
                alt="Order Slip"
                width={500}
                height={500}
                className="w-full max-w-md h-auto object-contain"
              />
            </div>
          </div>
          <SheetFooter>
            {order?.orderStatuses[order?.orderStatuses.length - 1]?.status ===
              OrderStatus.RECEIVED && (
              <ReadyToPayWarning _id={order?._id} onClose={onClose} />
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

export default ViewOrder

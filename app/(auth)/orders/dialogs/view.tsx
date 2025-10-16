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
import PaymentBadge from "@/components/payment-badge"
import UploadPaymentForm from "./upload-payment"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { IUser } from "@/types/user.interface"
import OrderForm from "./form"

const ORDER = gql`
  query Order($_id: ID!) {
    order(_id: $_id) {
      _id
      orderNumber
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
      paymentStatuses {
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

const CHANGE_ORDER_STATUS = gql`
  mutation ChangeOrderStatus($_id: ID!, $status: OrderStatus!) {
    changeOrderStatus(_id: $_id, status: $status) {
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
  const [openWarning, setOpenWarning] = useState<boolean>(false)
  const [changeOrderStatus, { loading }] = useMutation(CHANGE_ORDER_STATUS, {
    variables: { _id, status: OrderStatus.READY_TO_PAY },
  })

  const onCompleted = () => {
    setOpenWarning(false)
    onClose()
  }

  return (
    <AlertDialog open={openWarning} onOpenChange={setOpenWarning}>
      <AlertDialogTrigger asChild>
        <Button className="bg-yellow-600 hover:bg-yellow-600/90">
          Ready to Pay
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You will set this order as{" "}
            <span className="font-medium text-yellow-600 underline">
              ready for payment
            </span>{" "}
            and be sent to the cashier.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenWarning(false)}>
            Cancel
          </AlertDialogCancel>
          <Button
            className="bg-yellow-600 hover:bg-yellow-600/90"
            loading={loading}
            onClick={async () =>
              await changeOrderStatus().then((data: any) => {
                const message = data.data?.changeOrderStatus?.message
                if (message) toast.success(message)
                onCompleted()
              })
            }
          >
            Yes, ready to pay
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const CancelWarning = ({
  _id,
  onClose,
}: {
  _id?: string
  onClose: () => void
}) => {
  const [openWarning, setOpenWarning] = useState<boolean>(false)
  const [changeOrderStatus, { loading }] = useMutation(CHANGE_ORDER_STATUS, {
    variables: { _id, status: OrderStatus.CANCELLED },
  })

  const onCompleted = () => {
    setOpenWarning(false)
    onClose()
  }

  return (
    <AlertDialog open={openWarning} onOpenChange={setOpenWarning}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Cancel Order</Button>
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
          <AlertDialogCancel onClick={() => setOpenWarning(false)}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            loading={loading}
            onClick={async () =>
              await changeOrderStatus().then((data: any) => {
                const message = data.data?.changeOrderStatus?.message
                if (message) toast.success(message)
                onCompleted()
              })
            }
          >
            Yes, cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const ReleaseWarning = ({
  _id,
  onClose,
}: {
  _id?: string
  onClose: () => void
}) => {
  const [openWarning, setOpenWarning] = useState<boolean>(false)
  const [changeOrderStatus, { loading }] = useMutation(CHANGE_ORDER_STATUS, {
    variables: { _id, status: OrderStatus.RELEASED },
  })

  const onCompleted = () => {
    setOpenWarning(false)
    onClose()
  }

  return (
    <AlertDialog open={openWarning} onOpenChange={setOpenWarning}>
      <AlertDialogTrigger asChild>
        <Button className="bg-green-800 hover:bg-green-800">Release</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You will{" "}
            <span className="font-medium text-green-800 underline">
              release
            </span>{" "}
            the laundry back to the customer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenWarning(false)}>
            Cancel
          </AlertDialogCancel>
          <Button
            className="bg-green-800 hover:bg-green-800/90"
            loading={loading}
            onClick={async () =>
              await changeOrderStatus().then((data: any) => {
                const message = data.data?.changeOrderStatus?.message
                if (message) toast.success(message)
                onCompleted()
              })
            }
          >
            Yes, release
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const VerifyWarning = ({
  _id,
  onClose,
}: {
  _id?: string
  onClose: () => void
}) => {
  const [openWarning, setOpenWarning] = useState<boolean>(false)
  const [changeOrderStatus, { loading }] = useMutation(CHANGE_ORDER_STATUS, {
    variables: { _id, status: OrderStatus.VERIFIED },
  })

  const onCompleted = () => {
    setOpenWarning(false)
    onClose()
  }

  return (
    <AlertDialog open={openWarning} onOpenChange={setOpenWarning}>
      <AlertDialogTrigger asChild>
        <Button className="bg-blue-800 hover:bg-blue-800/90">Verify</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You will set this order as{" "}
            <span className="font-medium text-blue-800 underline">
              verified and fully paid
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenWarning(false)}>
            Cancel
          </AlertDialogCancel>
          <Button
            className="bg-blue-800 hover:bg-blue-800/90"
            loading={loading}
            onClick={async () =>
              await changeOrderStatus().then((data: any) => {
                const message = data.data?.changeOrderStatus?.message
                if (message) toast.success(message)
                onCompleted()
              })
            }
          >
            Yes, verify
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
  const { data: sessionData } = useSession()
  const isAdmin = (sessionData?.user as IUser)?.role === "ADMIN"
  const [openView, setOpenView] = useState<boolean>(false)
  const {
    data,
    loading,
    refetch: refreshData,
  } = useQuery(ORDER, {
    skip: !_id,
    variables: { _id },
  })

  const latestOrderStatus = (data as any)?.order?.orderStatuses[
    (data as any)?.order?.orderStatuses.length - 1
  ]?.status

  const showEdit = isAdmin || latestOrderStatus === OrderStatus.RECEIVED
  const showReadyToPay = latestOrderStatus === OrderStatus.RECEIVED
  const showCancel = latestOrderStatus === OrderStatus.RECEIVED
  const showRelease = latestOrderStatus === OrderStatus.READY_TO_PAY
  const showUpload =
    latestOrderStatus === OrderStatus.RELEASED ||
    latestOrderStatus === OrderStatus.READY_TO_PAY
  const showVerify = latestOrderStatus === OrderStatus.RELEASED

  const handleOpenChange = (isOpen: boolean) => {
    setOpenView(isOpen)
    if (isOpen && _id) refreshData()
  }

  const order = (data as any)?.order
  if (loading) return <Skeleton className="h-[120px] w-full rounded-none" />

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
            <SheetTitle>View Job Order</SheetTitle>
            <SheetDescription>
              View the details of the job order below.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-2 grid grid-cols-2 gap-2.5 items-start place-content-start flex-1 overflow-y-auto max-h-[100%]">
            <div className="grid gap-1">
              <Label>Current Status</Label>
              <StatusBadge
                status={
                  order?.orderStatuses[order?.orderStatuses.length - 1]?.status
                }
              />
            </div>
            <div className="grid gap-1">
              <Label>Payment Status</Label>
              <PaymentBadge
                status={
                  order?.paymentStatuses[order?.paymentStatuses.length - 1]
                    ?.status
                }
              />
            </div>
            <div className="grid gap-1 col-span-2">
              <Label>Job Order No.</Label>
              <span>{order?.orderNumber}</span>
            </div>
            <div className="grid gap-1 col-span-2">
              <Label>Customer Name</Label>
              <span>{order?.customerName}</span>
            </div>
            <div className="grid gap-1 col-span-2">
              <Label>Amount </Label>
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PHP",
                }).format(order?.amountToBePaid)}
              </span>
            </div>
            <div className="grid gap-1 col-span-2">
              <Label>Job Order Slip</Label>
              <Image
                src={order?.orderSlipURL}
                alt="Order Slip"
                width={500}
                height={500}
                className="w-full max-w-md h-auto object-contain"
                priority
                fetchPriority="high"
                loading="eager"
              />
            </div>
          </div>
          <SheetFooter>
            {showEdit && <OrderForm _id={order?._id} onCloseParent={onClose} />}
            {showReadyToPay && (
              <ReadyToPayWarning _id={order?._id} onClose={onClose} />
            )}
            {showCancel && <CancelWarning _id={order?._id} onClose={onClose} />}
            {showUpload && (
              <UploadPaymentForm _id={order?._id} onCloseParent={onClose} />
            )}
            {showRelease && (
              <ReleaseWarning _id={order?._id} onClose={onClose} />
            )}
            {showVerify && <VerifyWarning _id={order?._id} onClose={onClose} />}
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

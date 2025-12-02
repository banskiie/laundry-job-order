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
import { OrderStatus, POSStatus } from "@/types/order.interface"
import { useState } from "react"
import PaymentBadge from "@/components/payment-badge"
import UploadPaymentForm from "./upload-payment"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { IUser } from "@/types/user.interface"
import OrderForm from "./form"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Dot } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ORDER = gql`
  query Order($_id: ID!) {
    order(_id: $_id) {
      _id
      orderNumber
      customerName
      orderSlipURL
      amountToBePaid
      amountMissing
      addedToPOS
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
        amountPaid
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

const CHANGE_POS_STATUS = gql`
  mutation ChangeAddedToPOSStatus($_id: ID!, $status: POSStatus!) {
    changeAddedToPOSStatus(_id: $_id, status: $status) {
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

const ChangePOSStatus = ({
  _id,
  onClose,
  posStatus = POSStatus.UNADDED,
}: {
  _id?: string
  onClose: () => void
  posStatus?: POSStatus
}) => {
  const { data: sessionData } = useSession()
  const user = sessionData?.user as IUser
  const [openWarning, setOpenWarning] = useState<boolean>(false)
  const [status, setStatus] = useState<POSStatus>(posStatus)
  const [changePOSStatus, { loading }] = useMutation(CHANGE_POS_STATUS, {
    variables: { _id, status },
  })
  const isAdmin = user?.role === "ADMIN"

  const onCompleted = () => {
    setOpenWarning(false)
    onClose()
  }

  const onChangeStatusAsAdmin = async () =>
    await changePOSStatus().then((data: any) => {
      const message = data.data?.changeOrderStatus?.message
      if (message) toast.success(message)
      onCompleted()
    })

  const onChangeStatusAsUser = async () =>
    await changePOSStatus({
      variables: {
        _id,
        status:
          posStatus === POSStatus.ADDED ? POSStatus.UNADDED : POSStatus.ADDED,
      },
    }).then((data: any) => {
      const message = data.data?.changeOrderStatus?.message
      if (message) toast.success(message)
      onCompleted()
    })

  return (
    <AlertDialog open={openWarning} onOpenChange={setOpenWarning}>
      <AlertDialogTrigger asChild>
        <Button
          variant={posStatus ? "outline" : "default"}
          className={cn(
            "w-full",
            posStatus
              ? "border-purple-800 text-purple-800 hover:bg-purple-800/10"
              : "bg-purple-800 hover:bg-purple-800/90"
          )}
        >
          {posStatus === POSStatus.ADDED ? "Remove from POS" : "Add to POS"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAdmin
              ? "Are you sure?"
              : `${status === POSStatus.ADDED ? "Remove from" : "Add to"} POS`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin
              ? "You are changing the POS status of this order."
              : status === POSStatus.ADDED
              ? "You will remove this order from the POS system."
              : "You will add this order to the POS system. This will be verified by an admin."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isAdmin && (
          <Select
            onValueChange={(e) => setStatus(e as POSStatus)}
            value={status}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.values(POSStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenWarning(false)}>
            Cancel
          </AlertDialogCancel>
          <Button
            className="bg-purple-800 hover:bg-purple-800/90"
            loading={loading}
            onClick={async () =>
              isAdmin
                ? await onChangeStatusAsAdmin()
                : await onChangeStatusAsUser()
            }
          >
            {isAdmin
              ? "Yes, change POS status"
              : status === POSStatus.ADDED
              ? "Yes, remove from POS"
              : "Yes, add to POS"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const ViewOrderHistory = ({
  _id,
}: Readonly<{
  _id?: string
}>) => {
  const [openView, setOpenView] = useState<boolean>(false)
  const { data, refetch: refreshData } = useQuery(ORDER, {
    skip: !_id,
    variables: { _id },
  })

  const handleOpenChange = (isOpen: boolean) => {
    setOpenView(isOpen)
    if (isOpen && _id) refreshData()
  }
  const order = (data as any)?.order
  const onClose = () => setOpenView(false)

  const mergedStatuses = [...order?.orderStatuses, ...order?.paymentStatuses]

  return (
    <Sheet open={openView} onOpenChange={handleOpenChange} modal>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          View Order History
        </Button>
      </SheetTrigger>
      <SheetContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        side="left"
        className="min-w-full"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>View Job Order History</SheetTitle>
            <SheetDescription>
              View the details of the job order below.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-2 flex flex-col gap-2 flex-1 overflow-y-auto max-h-[100%]">
            {mergedStatuses
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((item: any, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="flex flex-col items-center h-full">
                    <Dot
                      className={cn(
                        "size-12 -my-3.5",
                        index > 0 ? "text-gray-400/80" : "text-green-800"
                      )}
                    />
                    {index < mergedStatuses.length - 1 && (
                      <div className="w-px flex-1 bg-gray-400/70" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex flex-col -my-px",
                      index > 0 ? "text-muted-foreground" : "text-green-800"
                    )}
                  >
                    <span className="block -mb-1">
                      {item.status.replaceAll("_", " ")}{" "}
                      {item.amountPaid &&
                        new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "PHP",
                        }).format(item.amountPaid)}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {format(new Date(item.date), "PPpp")}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      by {item.by?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <SheetFooter>
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
  const [openView, setOpenView] = useState<boolean>(false)
  const {
    data,
    loading,
    refetch: refreshData,
  } = useQuery(ORDER, {
    skip: !_id,
    variables: { _id },
  })

  const user = sessionData?.user as IUser
  const isCashier = user?.role === "CASHIER"
  const isAdmin = user?.role === "ADMIN"

  const latestOrderStatus = (data as any)?.order?.orderStatuses[
    (data as any)?.order?.orderStatuses.length - 1
  ]?.status

  const handleOpenChange = (isOpen: boolean) => {
    setOpenView(isOpen)
    if (isOpen && _id) refreshData()
  }

  const order = (data as any)?.order

  const showEdit = isAdmin || latestOrderStatus === OrderStatus.RECEIVED
  const showReadyToPay =
    latestOrderStatus === OrderStatus.RECEIVED && !isCashier
  const showCancel = latestOrderStatus === OrderStatus.RECEIVED
  const showRelease =
    latestOrderStatus === OrderStatus.READY_TO_PAY && order.amountMissing <= 0
  const showUpload =
    (latestOrderStatus === OrderStatus.RELEASED ||
      latestOrderStatus === OrderStatus.READY_TO_PAY) &&
    order.amountMissing > 0
  const showVerify = latestOrderStatus === OrderStatus.RELEASED && isAdmin
  const showPOSStatus = user?.role !== "STAFF"

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
            <SheetTitle>View Job Order History</SheetTitle>
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
              <Label className="text-orange-800">Amount Due</Label>
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PHP",
                }).format(order?.amountToBePaid)}
              </span>
            </div>
            {order?.amountMissing > 0 && order?.amountMissing && (
              <div className="grid gap-1 col-span-2">
                <Label className="text-blue-700">Unpaid Amount</Label>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(order?.amountMissing)}
                </span>
              </div>
            )}
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
              <UploadPaymentForm
                _id={order?._id}
                onCloseParent={onClose}
                unpaidAmount={order?.amountMissing}
              />
            )}
            {showRelease && (
              <ReleaseWarning _id={order?._id} onClose={onClose} />
            )}
            {showVerify && <VerifyWarning _id={order?._id} onClose={onClose} />}
            {showPOSStatus && (
              <ChangePOSStatus
                _id={order?._id}
                onClose={onClose}
                posStatus={order?.addedToPOS}
              />
            )}
            <ViewOrderHistory _id={order?._id} />
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

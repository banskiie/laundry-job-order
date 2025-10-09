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
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import Image from "next/image"

const ORDER = gql`
  query Order($_id: ID!) {
    order(_id: $_id) {
      _id
      customerName
      orderSlipURL
      amountToBePaid
      createdAt
      updatedAt
    }
  }
`

const ViewOrder = ({ _id }: { _id: string }) => {
  const { data } = useQuery(ORDER, { skip: !_id, variables: { _id } })
  const order = (data as any)?.order

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full">View</Button>
      </SheetTrigger>
      <SheetContent side="left" className="min-w-full" showCloseButton={false}>
        <div className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>View Job Order</SheetTitle>
            <SheetDescription>
              View the details of the job order below.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-2 flex flex-col gap-4 flex-1 overflow-y-auto max-h-[100%]">
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
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ViewOrder

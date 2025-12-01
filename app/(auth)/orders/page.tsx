"use client"
import React, { useEffect, useState } from "react"
import OrderForm from "./dialogs/form"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import ViewOrder from "./dialogs/view"
import StatusBadge from "@/components/status-badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrderStatus } from "@/types/order.interface"
import { useSession } from "next-auth/react"
import { IUser } from "@/types/user.interface"
import PaymentBadge from "@/components/payment-badge"
import { Input } from "@/components/ui/input"
import { TrashIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { pusherClient } from "@/lib/pusher"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

const ORDERS = gql`
  query Orders($first: Int!, $filter: [Filter], $search: String) {
    orders(first: $first, filter: $filter, search: $search) {
      total
      pages
      edges {
        cursor
        node {
          _id
          orderNumber
          customerName
          amountToBePaid
          dateReceived
          currentStatus
          paymentStatus
          addedToPOS
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

interface Filter {
  key: string
  value: string | number | boolean | (string | number | boolean)[]
  type: "TEXT" | "NUMBER" | "NUMBER_RANGE" | "DATE" | "DATE_RANGE" | "BOOLEAN"
}

const ROWS_INCREMENT = 5

const Page = () => {
  const { data: session } = useSession()
  const user: IUser & any = session?.user
  const role = user?.role as string
  const [rows, setRows] = useState<number>(ROWS_INCREMENT)
  const [search, setSearch] = useState<string>("")
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [filter, setFilter] = useState<Filter[]>(
    role === "STAFF"
      ? [{ key: "currentStatus", value: "RECEIVED", type: "TEXT" }]
      : []
  )
  const { data, refetch, loading } = useQuery(ORDERS, {
    variables: {
      first: rows,
      filter,
      search,
    },
    fetchPolicy: "network-only",
  })
  const [orderRows, setOrderRows] = useState<any>([])
  const isCashier = role === "CASHIER"

  console.log(data)

  useEffect(() => {
    if (data) setOrderRows((data as any).orders.edges)
  }, [data])

  useEffect(() => {
    const channel = pusherClient.subscribe("tables")
    channel.bind("refresh-table", (d: any) => {
      refetch()
      toast.success(d.message)
    })
    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [refetch])

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="w-full flex flex-col gap-2">
        <div className="flex">
          <Input
            placeholder="🔍 Search order... "
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchKeyword)
            }}
            className={cn(
              (search || searchKeyword) && "rounded-tr-none rounded-br-none",
              "flex-1 outline-none focus-visible:ring-0"
            )}
          />
          {(search || searchKeyword) && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                setSearch("")
                setSearchKeyword("")
              }}
              className="rounded-tl-none rounded-bl-none"
            >
              <TrashIcon />
            </Button>
          )}
        </div>
        {!isCashier && <OrderForm refetch={refetch} />}
        <Select
          value={
            filter.length
              ? (filter.find((f) => f.key === "currentStatus")?.value as string)
              : "*"
          }
          onValueChange={(value) => {
            if (value === "*") setFilter([])
            else setFilter([{ key: "currentStatus", value, type: "TEXT" }])
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="*">All</SelectItem>
              <SelectItem value={OrderStatus.RECEIVED}>Received</SelectItem>
              <SelectItem value={OrderStatus.READY_TO_PAY}>
                Ready to Pay
              </SelectItem>
              <SelectItem value={OrderStatus.RELEASED}>Released</SelectItem>
              <SelectItem value={OrderStatus.VERIFIED}>Verified</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground text-center">
          {loading ? (
            "Loading..."
          ) : (
            <span>
              Showing {orderRows.length} results for{" "}
              <span className="font-medium capitalize">
                {filter.length
                  ? (filter[0]?.value as string)
                      .replaceAll("_", " ")
                      .toLowerCase()
                  : "all"}
              </span>
            </span>
          )}
        </span>
        {orderRows.map((o: any) => (
          <ViewOrder key={o.cursor} _id={o.node._id} refetch={refetch}>
            <div className="p-2 border flex gap-2 justify-between">
              <div>
                <span className="block text-sm">
                  Order #:{" "}
                  <span className="font-medium">{o.node.orderNumber}</span>
                </span>
                <span className="block text-sm">
                  Customer:{" "}
                  <span className="font-medium">{o.node.customerName}</span>
                </span>
                <span className="block text-sm">
                  Amount:{" "}
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PHP",
                    }).format(o.node.amountToBePaid)}
                  </span>
                </span>
                <span className="block text-sm">
                  Date: {format(new Date(o.node.dateReceived), "Ppp")}
                </span>
                <div className="flex gap-1">
                  <StatusBadge status={o.node.currentStatus} />
                  <PaymentBadge status={o.node.paymentStatus} />
                  {o.node.addedToPOS && <Badge>Added to POS</Badge>}
                </div>
              </div>
            </div>
          </ViewOrder>
        ))}
        {!!(data && (data as any).orders.total > rows) && (
          <Button
            variant="link"
            size="lg"
            onClick={() => setRows((p) => p + ROWS_INCREMENT)}
          >
            Load more...
          </Button>
        )}
      </div>
    </div>
  )
}

export default Page

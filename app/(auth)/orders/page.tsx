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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrderStatus } from "@/types/order.interface"

const ORDERS = gql`
  query Orders($first: Int!, $filter: [Filter]) {
    orders(first: $first, filter: $filter) {
      total
      pages
      edges {
        cursor
        node {
          _id
          customerName
          amountToBePaid
          dateReceived
          currentStatus
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
  const [rows, setRows] = useState<number>(ROWS_INCREMENT)
  const [filter, setFilter] = useState<Filter[]>([
    { key: "currentStatus", value: OrderStatus.RECEIVED, type: "TEXT" },
  ])
  const { data, refetch, loading } = useQuery(ORDERS, {
    variables: {
      first: rows,
      filter,
    },
    fetchPolicy: "network-only",
  })
  const [orderRows, setOrderRows] = useState<any>([])

  useEffect(() => {
    if (data) setOrderRows((data as any).orders.edges)
  }, [data])

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="w-full flex flex-col gap-2">
        <OrderForm refetch={refetch} />
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
              <SelectItem value={OrderStatus.FOR_PAYMENT}>
                For Payment
              </SelectItem>
              <SelectItem value={OrderStatus.PARTIALLY_PAID}>
                Partially Paid
              </SelectItem>
              <SelectItem value={OrderStatus.PAID}>Fully Paid</SelectItem>
              <SelectItem value={OrderStatus.RELEASED}>Released</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground text-center">
          {loading ? (
            "Searching..."
          ) : (
            <span>
              Showing {orderRows.length} results for{" "}
              <span className="font-medium capitalize">
                {filter.length
                  ? (filter[0]?.value as string).replace("_", " ").toLowerCase()
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
                  Customer: {o.node.customerName}
                </span>
                <span className="block text-sm">
                  Amount:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(o.node.amountToBePaid)}
                </span>
                <span className="block text-sm">
                  Date: {format(new Date(o.node.dateReceived), "MMM d, yyyy")}
                </span>
                <StatusBadge status={o.node.currentStatus} />
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

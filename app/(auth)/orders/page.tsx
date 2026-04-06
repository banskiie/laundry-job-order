"use client"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { useEffect, useMemo, useState } from "react"
import ViewOrder from "./dialogs/view"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import StatusBadge from "@/components/status-badge"
import PaymentBadge from "@/components/payment-badge"
import { toast } from "sonner"
import { pusherClient } from "@/lib/pusher"
import OrderForm from "./dialogs/form"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrderStatus, POSStatus } from "@/types/order.interface"
import { DatePickerWithRange } from "@/components/date-range-picker"

const ORDERS_LIST = gql`
  query OrderList($rows: Int, $page: Int, $search: String, $filter: [Filter]) {
    orderList(rows: $rows, page: $page, search: $search, filter: $filter) {
      total
      pages
      edges {
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
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

const Page = () => {
  const [page, setPage] = useState<number>(1)
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [searchType, setSearchType] = useState<"🔍" | "📅">("🔍")
  const [filter, setFilter] = useState<
    { key: string; value: any; type: string }[]
  >([])
  const { data, fetchMore, refetch, loading } = useQuery(ORDERS_LIST, {
    variables: {
      search,
      filter,
      page,
    },
    fetchPolicy: "network-only",
  })


  const pageCount = useMemo(
    () => (data as { orderList: { pages: number } })?.orderList?.pages,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(data as { orderList: { pages: number } })?.orderList?.pages],
  )

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

  const nextPage = () => {
    setPage((prev) => prev + 1)
    fetchMore({
      variables: {
        page: page + 1,
      },
      updateQuery: (prevResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prevResult
        return fetchMoreResult
      },
    })
  }

  const prevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1)
      fetchMore({
        variables: {
          page: page - 1,
        },
        updateQuery: (prevResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prevResult
          return fetchMoreResult
        },
      })
    }
  }

  return (
    <div className="space-y-2 p-3">
      <OrderForm refetch={refetch} />
      <div className="flex flex-col gap-2">
        <InputGroup>
          <InputGroupButton
            size="icon-sm"
            onClick={() => {
              setSearchType((prev) => (prev === "🔍" ? "📅" : "🔍"))
              setSearch("")
              setFilter((prev) => prev.filter((f) => f.key !== "dateReceived"))
            }}
          >
            {searchType}
          </InputGroupButton>
          {searchType === "🔍" ? (
            <InputGroupInput
              placeholder="Search here..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchKeyword)
                  setPage(1)
                }
              }}
            />
          ) : (
            <DatePickerWithRange setFilter={setFilter} />
          )}
        </InputGroup>
        <Select
          onValueChange={(value) => {
            setFilter((prev) => {
              const filtered = prev.filter((f) => f.key !== "addedToPOS")
              if (value === "all") {
                return filtered
              } else {
                return [
                  ...filtered,
                  {
                    key: "addedToPOS",
                    type: "TEXT",
                    value,
                  },
                ]
              }
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="POS Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All POS Status</SelectItem>
              <SelectItem value={POSStatus.VERIFIED}>Verified</SelectItem>
              <SelectItem value={POSStatus.ADDED}>Added</SelectItem>
              <SelectItem value={POSStatus.UNADDED}>Unadded</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => {
            setFilter((prev) => {
              const filtered = prev.filter((f) => f.key !== "currentStatus")
              if (value === "all") {
                return filtered
              } else {
                return [
                  ...filtered,
                  {
                    key: "currentStatus",
                    type: "TEXT",
                    value,
                  },
                ]
              }
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Order Status</SelectItem>
              <SelectItem value={OrderStatus.VERIFIED}>Verified</SelectItem>
              <SelectItem value={OrderStatus.READY_TO_PAY}>
                Ready to Pay
              </SelectItem>
              <SelectItem value={OrderStatus.RELEASED}>Released</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
              <SelectItem value={OrderStatus.RECEIVED}>Received</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between items-center">
        <span>
          Total:{" "}
          <span className="font-medium">
            {(data as { orderList: { total: number } })?.orderList?.total || 0}
          </span>
        </span>
        <ButtonGroup>
          <Button
            onClick={prevPage}
            variant="outline"
            disabled={page === 1}
            size="sm"
          >
            Prev
          </Button>
          <ButtonGroupText>
            {page} of {pageCount || 1}
          </ButtonGroupText>
          <Button
            onClick={nextPage}
            variant="outline"
            disabled={page >= pageCount}
            size="sm"
          >
            Next
          </Button>
        </ButtonGroup>
      </div>
      {loading
        ? Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-30 w-full bg-border animate-pulse" />
          ))
        : ((data as any)?.orderList?.edges || []).map((o: any) => (
            <ViewOrder key={o.node._id} _id={o.node._id} refetch={refetch}>
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
                    {o.node.paymentStatus === "PAID" &&
                    o.node.currentStatus === "READY_TO_PAY" ? (
                      <Badge className="bg-pink-800">Ready for Release</Badge>
                    ) : (
                      <StatusBadge status={o.node.currentStatus} />
                    )}
                    <PaymentBadge status={o.node.paymentStatus} />
                    {o.node.addedToPOS !== "UNADDED" &&
                      (() => {
                        if (o.node.addedToPOS === "ADDED") {
                          return (
                            <Badge className="bg-blue-800">Added to POS</Badge>
                          )
                        } else if (o.node.addedToPOS === "VERIFIED") {
                          return (
                            <Badge className="bg-green-800">POS Verified</Badge>
                          )
                        }
                      })()}
                  </div>
                </div>
              </div>
            </ViewOrder>
          ))}
    </div>
  )
}

export default Page

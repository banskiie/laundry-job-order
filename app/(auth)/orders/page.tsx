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
import { Skeleton } from "@/components/ui/skeleton"
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

const ORDERS_LIST = gql`
  query OrderList($rows: Int, $page: Int, $search: String) {
    orderList(rows: $rows, page: $page, search: $search) {
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
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const { data, fetchMore, refetch, loading } = useQuery(ORDERS_LIST, {
    variables: {
      search,
    },
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
    setPageIndex((prev) => prev + 1)
    fetchMore({
      variables: {
        page: pageIndex + 1,
      },
      updateQuery: (prevResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prevResult
        return fetchMoreResult
      },
    })
  }

  const prevPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1)
      fetchMore({
        variables: {
          page: pageIndex - 1,
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
      <div>
        <InputGroup>
          <InputGroupButton size="icon-sm">🔍</InputGroupButton>
          <InputGroupInput
            placeholder="Search here..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchKeyword)
                setPageIndex(0)
              }
            }}
          />
        </InputGroup>
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
            disabled={pageIndex === 0}
            size="sm"
          >
            Prev
          </Button>
          <ButtonGroupText>
            {pageIndex + 1} of {pageCount || 1}
          </ButtonGroupText>
          <Button
            onClick={nextPage}
            variant="outline"
            disabled={pageIndex + 1 >= pageCount}
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

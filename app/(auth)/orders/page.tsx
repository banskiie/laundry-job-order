"use client"
import React, { useEffect, useMemo, useState } from "react"
import OrderForm from "./dialogs/form"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns"
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
import { ChevronDownIcon, TrashIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { pusherClient } from "@/lib/pusher"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { formatDateRange } from "little-date"
import { Calendar } from "@/components/ui/calendar"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"

const ORDERS = gql`
  query Orders(
    $first: Int!
    $after: String
    $filter: [Filter]
    $search: String
  ) {
    orders(first: $first, after: $after, filter: $filter, search: $search) {
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

const ROWS_INCREMENT = 10

const Page = () => {
  const { data: session } = useSession()
  const user: IUser & any = session?.user
  const role = user?.role as string

  const [page, setPage] = useState<{
    current: number
    loaded: number
    max: number
  }>({
    current: 1,
    loaded: 1,
    max: 1,
  })

  const [rows, setRows] = useState<number>(ROWS_INCREMENT)
  const [search, setSearch] = useState<string>("")
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [filter, setFilter] = useState<Filter[]>(
    role === "STAFF"
      ? [{ key: "currentStatus", value: "RECEIVED", type: "TEXT" }]
      : []
  )
  const { data, refetch, fetchMore, loading } = useQuery(ORDERS, {
    variables: {
      first: rows * page.current,
      filter,
      search,
    },
    fetchPolicy: "no-cache",
  })
  const isCashier = role === "CASHIER"
  const [searchType, setSearchType] = useState<"INPUT" | "DATE_RANGE">("INPUT")

  const [openDateRangePopover, setOpenDateRangePopover] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })

  const { total, nodes, pageInfo } = useMemo(() => {
    const nodes =
      (data as any)?.orders.edges.map((edge: any) => edge.node) || []
    const pageInfo = (data as any)?.orders.pageInfo

    setPage((prev) => ({
      ...prev,
      max: (data as any)?.orders.pages,
    }))

    return {
      total: (data as any)?.orders.total,
      nodes,
      pageInfo,
    }
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

  const goNext = async () => {
    if (page.current === page.max) return
    if (page.current === page.loaded) {
      await fetchMore({
        variables: {
          first: rows,
          after: pageInfo.endCursor,
          search,
          filter,
        },
        updateQuery: (prev: any, { fetchMoreResult: more }: any) => {
          if (!more) return prev
          return {
            orders: {
              ...prev.orders,
              edges: [...prev.orders.edges, ...more.orders.edges],
              pageInfo: more.orders.pageInfo,
            },
          }
        },
      })
      setPage((prev) => ({
        ...prev,
        loaded: prev.loaded + 1,
      }))
    }

    setPage((prev) => ({
      ...prev,
      current: prev.current + 1,
    }))
  }

  const goPrev = () => {
    if (page.current === 1) return
    setPage((prev) => ({
      ...prev,
      current: prev.current - 1,
    }))
  }

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="w-full flex flex-col gap-2">
        {!isCashier && <OrderForm refetch={refetch} />}
        <div className="flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchType((p) => (p === "INPUT" ? "DATE_RANGE" : "INPUT"))
            }}
            className="rounded-tr-none rounded-br-none"
          >
            {searchType === "INPUT" ? "🔍" : "📅"}
          </Button>
          {searchType === "DATE_RANGE" ? (
            <Popover
              open={openDateRangePopover}
              onOpenChange={setOpenDateRangePopover}
            >
              <PopoverTrigger asChild>
                <div className="w-full flex items-center">
                  <Button
                    variant="outline"
                    id="date"
                    className={cn(
                      "flex-1 justify-between font-normal text-base text-muted-foreground rounded-l-none",
                      dateRange?.from &&
                        dateRange?.to &&
                        "text-black rounded-r-none"
                    )}
                  >
                    {dateRange?.from && dateRange?.to
                      ? formatDateRange(dateRange.from, dateRange.to, {
                          includeTime: false,
                        })
                      : `Filter Date`}
                    <ChevronDownIcon />
                  </Button>
                  {(dateRange?.from || dateRange?.to) && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setDateRange({ from: undefined, to: undefined })
                        setFilter((prev) =>
                          prev.filter((f) => f.key !== "dateReceived")
                        )
                      }}
                      className="rounded-l-none"
                    >
                      <TrashIcon />
                    </Button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0 flex"
                align="start"
              >
                <div className="p-2 flex flex-col items-center border-r space-y-1.5">
                  <Label className="text-sm font-normal text-muted-foreground text-center">
                    Quick Select
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setDateRange({
                        from: startOfDay(new Date()),
                        to: endOfDay(new Date()),
                      })
                    }
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setDateRange({
                        from: startOfWeek(new Date()),
                        to: endOfWeek(new Date()),
                      })
                    }
                  >
                    This Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date()),
                      })
                    }
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setDateRange({
                        from: startOfYear(new Date()),
                        to: endOfYear(new Date()),
                      })
                    }
                  >
                    This Year
                  </Button>
                </div>
                <div>
                  <Calendar
                    mode="range"
                    captionLayout="dropdown"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                  <div className="p-2 flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined })
                        setFilter([])
                        setOpenDateRangePopover(false)
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined })
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!dateRange?.from || !dateRange?.to) return
                        const dateRangeISO = `${format(
                          new Date(dateRange?.from),
                          "yyyy-MM-dd"
                        )}_${format(new Date(dateRange?.to), "yyyy-MM-dd")}`
                        setFilter((prev) => [
                          ...prev.filter((f) => f.key !== "dateReceived"),
                          {
                            key: "dateReceived",
                            value: dateRangeISO,
                            type: "DATE_RANGE",
                          },
                        ])
                        setOpenDateRangePopover(false)
                      }}
                    >
                      Filter
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Input
                placeholder="Search..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSearch(searchKeyword)
                }}
                className={cn(
                  (search || searchKeyword) &&
                    "rounded-tr-none rounded-br-none",
                  "flex-1 outline-none focus-visible:ring-0 rounded-tl-none rounded-bl-none"
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
            </>
          )}
        </div>
        <Select
          value={
            filter.length
              ? (filter.find((f) => f.key === "currentStatus")?.value as string)
              : "*"
          }
          onValueChange={(value) => {
            if (value === "*")
              setFilter((prev) => prev.filter((f) => f.key !== "currentStatus"))
            else
              setFilter((prev) => [
                { key: "currentStatus", value, type: "TEXT" },
                ...prev.filter((f) => f.key !== "currentStatus"),
              ])
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
        <Select
          value={
            filter.length
              ? (filter.find((f) => f.key === "addedToPOS")?.value as string)
              : "*"
          }
          onValueChange={(value) => {
            if (value === "*")
              setFilter((prev) => prev.filter((f) => f.key !== "addedToPOS"))
            else
              setFilter((prev) => [
                { key: "addedToPOS", value, type: "TEXT" },
                ...prev.filter((f) => f.key !== "addedToPOS"),
              ])
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="*">All Orders</SelectItem>
              <SelectItem value="ADDED">Added to POS</SelectItem>
              <SelectItem value="UNADDED">Not in POS</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground text-center ">
          {loading ? (
            "Loading..."
          ) : (
            <div className="flex md:flex-row md:justify-between items-center px-1 flex-col">
              <span className="block">
                Showing {(page.current - 1) * rows + 1}-
                {page.current === page.max ? total : page.current * rows} out of{" "}
                {total} result{total === 1 ? "" : "s"} for{" "}
                <span className="font-medium capitalize">
                  {(() => {
                    if (search && searchKeyword) return `"${searchKeyword}"`
                    if (!filter.length) return "all"
                    if (filter[0]?.key === "dateReceived") {
                      const [start, end] = (filter[0]?.value as string).split(
                        "_"
                      )
                      return formatDateRange(new Date(start), new Date(end), {
                        includeTime: false,
                      })
                    }
                    return filter[0]?.value
                      .toString()
                      .replaceAll("_", " ")
                      .toLowerCase()
                  })()}
                </span>
              </span>
              <ButtonGroup>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page.current === 1}
                  onClick={goPrev}
                  className="disabled:bg-muted disabled:border-gray-300 h-7 text-sm"
                >
                  Prev
                </Button>
                <ButtonGroupText className="font-normal text-muted-foreground text-sm h-7">
                  Page {page.current}
                </ButtonGroupText>
                <Button
                  variant="outline"
                  disabled={page.current === page.max || !pageInfo.hasNextPage}
                  onClick={goNext}
                  size="sm"
                  className="disabled:bg-muted disabled:border-gray-300 h-7 text-sm"
                >
                  Next
                </Button>
              </ButtonGroup>
            </div>
          )}
        </span>
        {(
          nodes.slice((page.current - 1) * rows, page.current * rows) || []
        ).map((o: any) => (
          <ViewOrder key={o._id} _id={o._id} refetch={refetch}>
            <div className="p-2 border flex gap-2 justify-between">
              <div>
                <span className="block text-sm">
                  Order #: <span className="font-medium">{o.orderNumber}</span>
                </span>
                <span className="block text-sm">
                  Customer:{" "}
                  <span className="font-medium">{o.customerName}</span>
                </span>
                <span className="block text-sm">
                  Amount:{" "}
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PHP",
                    }).format(o.amountToBePaid)}
                  </span>
                </span>
                <span className="block text-sm">
                  Date: {format(new Date(o.dateReceived), "Ppp")}
                </span>
                <div className="flex gap-1">
                  {o.paymentStatus === "PAID" &&
                  o.currentStatus === "READY_TO_PAY" ? (
                    <Badge className="bg-pink-800">Ready for Release</Badge>
                  ) : (
                    <StatusBadge status={o.currentStatus} />
                  )}
                  <PaymentBadge status={o.paymentStatus} />
                  {o.addedToPOS !== "UNADDED" &&
                    (() => {
                      if (o.addedToPOS === "ADDED") {
                        return (
                          <Badge className="bg-blue-800">Added to POS</Badge>
                        )
                      } else if (o.addedToPOS === "VERIFIED") {
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
    </div>
  )
}

export default Page

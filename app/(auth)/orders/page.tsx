"use client"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { useEffect, useMemo, useState } from "react"
import ViewOrder from "./dialogs/view"
import { endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns"
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderStatus } from "@/types/order.interface"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { formatDateRange } from "little-date"
import { ChevronDownIcon, TrashIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useSession } from "next-auth/react"
import { IUser, Role } from "@/types/user.interface"

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
  const { data: session } = useSession()
  const user: IUser & any = session?.user
  const role = user?.role as string
  console.log(role)
  const [page, setPage] = useState<number>(1)
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [filters, setFilters] = useState<any[]>([])
  const { data, fetchMore, refetch, loading } = useQuery(ORDERS_LIST, {
    variables: {
      search,
      filter: filters,
    },
    fetchPolicy: "network-only"
  })
  const [searchType, setSearchType] = useState<"🔍" | "📅">("🔍")
  const pageCount = useMemo(
    () => (data as { orderList: { pages: number } })?.orderList?.pages,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(data as { orderList: { pages: number } })?.orderList?.pages],
  )
  const orderStatuses = Object.values(OrderStatus).map((status) => ({
    label: status.replaceAll("_", " ").toLocaleLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    value: status,
  }))
  const posStatuses = [
    {
      label: "Unadded",
      value: "UNADDED",
    },
    {
      label: "Added",
      value: "ADDED",
    },
    {
      label: "Verified",
      value: "VERIFIED",
    },
  ]
  const [openCalendar, setOpenCalendar] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })


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


  const resetPage = () => setPage(1)

  return (
    <div className="space-y-2 p-3">
      {role !== Role.CASHIER && <OrderForm refetch={refetch} />}
      {role !== Role.STAFF && (<div className="flex flex-col gap-2">
        <InputGroup>
          <InputGroupButton size="icon-sm" onClick={() => setSearchType(prev => prev === "🔍" ? "📅" : "🔍")}>
            {
              searchType === "🔍" ? "🔍" : "📅"
            }
          </InputGroupButton>
          {
            searchType === "📅" ? (
              <Popover
                open={openCalendar}
                onOpenChange={setOpenCalendar}
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
                          setFilters((prev) =>
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
                          setFilters([])
                          setOpenCalendar(false)
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
                          setFilters((prev) => [
                            ...prev.filter((f) => f.key !== "dateReceived"),
                            {
                              key: "dateReceived",
                              value: dateRangeISO,
                              type: "DATE_RANGE",
                            },
                          ])
                          setOpenCalendar(false)
                        }}
                      >
                        Filter
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : <InputGroupInput
              placeholder="Search here..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchKeyword)
                  resetPage()
                }
              }}
            />
          }

        </InputGroup>
        <Select
          defaultValue={"*"}
          onValueChange={(value) => {
            setFilters((prev) => {
              const newFilters = prev.filter((f) => f.key !== "currentStatus")
              if (value === "*") {
                return newFilters
              }
              if (value) {
                newFilters.push({
                  key: "currentStatus",
                  value,
                  type: "TEXT",
                })
              }
              return newFilters
            })
            resetPage()
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Status Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="*">All Statuses</SelectItem>
              {
                orderStatuses.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}

                  >
                    {status.label}
                  </SelectItem>
                ))
              }
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          defaultValue="*"
          onValueChange={(value) => {
            setFilters((prev) => {
              const newFilters = prev.filter((f) => f.key !== "addedToPOS")
              if (value === "*") {
                return newFilters
              }
              if (value) {
                newFilters.push({
                  key: "addedToPOS",
                  value,
                  type: "TEXT",
                })
              }
              return newFilters
            })
            resetPage()
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select POS Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="*">All POS Statuses</SelectItem>
              {
                posStatuses.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}

                  >
                    {status.label}
                  </SelectItem>
                ))
              }
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>)}

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
            disabled={page + 1 >= pageCount}
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
        : ((data as any)?.orderList?.edges || []).map((o: any) => {
          return (
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
          )
        })}
    </div>
  )
}

export default Page
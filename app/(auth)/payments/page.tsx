"use client"
import React, { useEffect, useState } from "react"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import ViewPayment from "./dialogs/view"
import { useSession } from "next-auth/react"
import { IUser } from "@/types/user.interface"
import { Input } from "@/components/ui/input"
import { TrashIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { pusherClient } from "@/lib/pusher"
import { toast } from "sonner"

const PAYMENTS = gql`
  query Payments($first: Int!, $search: String) {
    payments(first: $first, search: $search) {
      total
      pages
      edges {
        cursor
        node {
          _id
          customerName
          amountPaid
          datePaid
          paymentMethod
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
  const [rows, setRows] = useState<number>(ROWS_INCREMENT)
  const [search, setSearch] = useState<string>("")
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const { data, refetch, loading } = useQuery(PAYMENTS, {
    variables: {
      first: rows,
      search,
    },
    fetchPolicy: "network-only",
  })
  const [paymentRows, setPaymentRows] = useState<any>([])

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

  useEffect(() => {
    if (data) setPaymentRows((data as any).payments.edges)
  }, [data])

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="w-full flex flex-col gap-2">
        <div className="flex">
          <Input
            placeholder="🔍 Search payment... "
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
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground text-center">
          {loading ? (
            "Loading..."
          ) : (
            <span>Showing {paymentRows.length} results.</span>
          )}
        </span>
        {paymentRows.map((o: any) => (
          <ViewPayment key={o.cursor} _id={o.node._id} refetch={refetch}>
            <div
              key={o.cursor}
              className="p-2 border flex gap-2 justify-between"
            >
              <div>
                <span className="block text-sm">
                  Customer: {o.node.customerName}
                </span>
                <span className="block text-sm capitalize">
                  Payment Method:{" "}
                  {o.node.paymentMethod.replaceAll("_", " ").toLowerCase()}
                </span>
                <span className="block text-sm">
                  Amount:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(o.node.amountPaid)}
                </span>
                <span className="block text-sm">
                  Date Paid: {format(new Date(o.node.datePaid), "Ppp")}
                </span>
              </div>
            </div>
          </ViewPayment>
        ))}
        {!!(data && (data as any).payments.total > rows) && (
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

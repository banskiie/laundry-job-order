"use client"
import React from "react"
import OrderForm from "./dialogs/form"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import ViewOrder from "./dialogs/view"

const ORDERS = gql`
  query Orders {
    orders(first: 5) {
      total
      pages
      edges {
        cursor
        node {
          _id
          customerName
          amountToBePaid
          dateReceived
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

const Page = () => {
  const { data, refetch, loading } = useQuery(ORDERS, {
    fetchPolicy: "network-only",
    pollInterval: 10000,
  })
  const orders = (data as any)?.orders?.edges || []
  console.log(orders)

  return (
    <div className="flex flex-col p-2">
      <div className="w-full">
        <OrderForm refetch={refetch} />
      </div>
      <div className="flex flex-col gap-2 mt-4 shadow">
        {orders.map((o: any) => (
          <div className="p-2 border flex flex-col gap-2" key={o.cursor}>
            <div>
              <span className="block">Customer: {o.node.customerName}</span>
              <span className="block">
                Amount:{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PHP",
                }).format(o.node.amountToBePaid)}
              </span>
              <span className="block">
                Date: {format(new Date(o.node.dateReceived), "MMM d, yyyy")}
              </span>
            </div>
            <ViewOrder _id={o.node._id} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Page

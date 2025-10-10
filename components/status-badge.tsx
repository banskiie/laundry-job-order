import { OrderStatus } from "@/types/order.interface"
import React from "react"
import { Badge } from "./ui/badge"

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const currentStatus = status.toLocaleLowerCase().replaceAll("_", " ")
  switch (status) {
    case OrderStatus.RECEIVED:
      return <Badge className="capitalize bg-slate-700">{currentStatus}</Badge>
    case OrderStatus.FOR_PAYMENT:
      return <Badge className="capitalize bg-orange-700">{currentStatus}</Badge>
    case OrderStatus.PARTIALLY_PAID:
      return <Badge className="capitalize bg-orange-700">{currentStatus}</Badge>
    case OrderStatus.PAID:
      return <Badge className="capitalize bg-amber-500">{currentStatus}</Badge>
    case OrderStatus.RELEASED:
      return <Badge className="capitalize bg-green-700">{currentStatus}</Badge>
    case OrderStatus.CANCELLED:
      return <Badge className="capitalize bg-red-700">{currentStatus}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default StatusBadge

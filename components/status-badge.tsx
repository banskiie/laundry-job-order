import { OrderStatus } from "@/types/order.interface"
import React from "react"
import { Badge } from "./ui/badge"

const StatusBadge = ({ status }: { status?: OrderStatus }) => {
  const currentStatus = status?.toLocaleLowerCase().replaceAll("_", " ")
  switch (status) {
    case OrderStatus.RECEIVED:
      return <Badge className="capitalize bg-slate-700">{currentStatus}</Badge>
    case OrderStatus.READY_TO_PAY:
      return <Badge className="capitalize bg-yellow-600">{currentStatus}</Badge>
    case OrderStatus.RELEASED:
      return <Badge className="capitalize bg-green-800">{currentStatus}</Badge>
    case OrderStatus.VERIFIED:
      return <Badge className="capitalize bg-blue-800">{currentStatus}</Badge>
    case OrderStatus.CANCELLED:
      return (
        <Badge className="capitalize bg-destructive">{currentStatus}</Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default StatusBadge

import { PaymentStatus } from "@/types/order.interface"
import React from "react"
import { Badge } from "./ui/badge"

const PaymentBadge = ({ status }: { status: PaymentStatus }) => {
  const currentStatus = status.toLocaleLowerCase().replaceAll("_", " ")
  switch (status) {
    case PaymentStatus.UNPAID:
      return (
        <Badge
          variant="outline"
          className="capitalize border-destructive text-destructive"
        >
          {currentStatus}
        </Badge>
      )
    case PaymentStatus.PARTIALLY_PAID:
      return (
        <Badge
          variant="outline"
          className="capitalize border-primary text-primary"
        >
          {currentStatus}
        </Badge>
      )
    case PaymentStatus.PAID:
      return (
        <Badge
          variant="outline"
          className="capitalize border-green-700 text-green-700"
        >
          Fully {currentStatus}
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default PaymentBadge

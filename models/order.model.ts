import { model, models, Schema } from "mongoose"
import {
  OrderStatus,
  type IOrder,
  type IOrderStatusItem,
} from "../types/order.interface"

const OrderStatusItem = new Schema<IOrderStatusItem>(
  {
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    date: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
)

const Order = new Schema<IOrder>(
  {
    customerName: { type: String, required: true },
    orderSlipURL: { type: String, required: true },
    amountToBePaid: { type: Number, required: true },
    orderStatuses: [OrderStatusItem],
  },
  { timestamps: true }
)

export default models.Order || model<IOrder>("Order", Order)

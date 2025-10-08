import { model, Schema } from "mongoose"
import { OrderStatus, type IOrder } from "../types/order.interface.js"

const Order = new Schema<IOrder>(
  {
    customerName: { type: String, required: true },
    orderSlipURL: { type: String, required: true },
    amountToBePaid: { type: Number, required: true },
    orderStatuses: [
      {
        status: {
          type: String,
          enum: Object.values(OrderStatus),
          required: true,
        },
        date: { type: Date, required: true },
        by: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
  },
  { timestamps: true }
)

export default model<IOrder>("Order", Order)

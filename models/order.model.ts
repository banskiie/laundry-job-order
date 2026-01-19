import { model, models, Schema } from "mongoose"
import {
  IComment,
  IPaymentStatusItem,
  OrderStatus,
  PaymentStatus,
  POSStatus,
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
  { _id: false },
)

const PaymentStatusItem = new Schema<IPaymentStatusItem>(
  {
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
    },
    date: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountPaid: { type: Number, required: false },
  },
  { _id: false },
)

const Comment = new Schema<IComment>(
  {
    message: {
      type: String,
    },
    date: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    _id: false,
  },
)

const Order = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    orderSlipURL: { type: String, required: true },
    amountToBePaid: { type: Number, required: true },
    orderStatuses: [OrderStatusItem],
    paymentStatuses: [PaymentStatusItem],
    addedToPOS: {
      type: String,
      enum: Object.values(POSStatus),
      default: POSStatus.UNADDED,
    },
    comments: {
      type: [
        {
          type: Comment,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
)

export default models.Order || model<IOrder>("Order", Order)

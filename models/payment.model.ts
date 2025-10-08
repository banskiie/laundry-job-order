import { model, Schema } from "mongoose"
import { PaymentMethod, type IPayment } from "../types/payment.interface.js"

const Payment = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    proofOfPaymentURL: { type: String, required: false },
    amountPaid: { type: Number, required: true },
    datePaid: { type: Date, required: true },
  },
  { timestamps: true }
)

export default model<IPayment>("Payment", Payment)

import { model, models, Schema } from "mongoose"
import { PaymentMethod, type IPayment } from "../types/payment.interface"

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

export default models.Payment || model<IPayment>("Payment", Payment)

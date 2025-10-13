import { Document, ObjectId } from "mongoose"
import { IPageInfo } from "./shared.interface"
import { IOrder } from "./order.interface"

export enum PaymentMethod {
  CASH = "CASH",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  GCASH = "GCASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  SALARY_DEDUCTION = "SALARY_DEDUCTION",
}

export interface IPayment extends Document {
  _id: ObjectId
  order: IOrder
  proofOfPaymentURL?: string
  paymentMethod: PaymentMethod
  amountPaid: number
  datePaid: Date
}

export interface IPaymentInput extends Request {
  _id: ObjectId
  order: ObjectId
  proofOfPaymentURL?: string
  paymentMethod: PaymentMethod
  amountPaid: number
  datePaid: Date
  isFullyPaid?: boolean
}

export interface IPaymentNode {
  _id: ObjectId
  customerName?: string
  amountPaid: number
  datePaid: Date
}

export interface IPaymentEdge {
  node: IPaymentNode
  cursor: string
}

export interface IPaymentConnection {
  edges: IPaymentEdge[]
  pageInfo: IPageInfo
}

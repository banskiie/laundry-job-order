import { Document, ObjectId } from "mongoose"
import { IPageInfo } from "./shared.interface"
import { IUser } from "./user.interface"

export enum OrderStatus {
  RECEIVED = "RECEIVED",
  READY_TO_PAY = "READY_TO_PAY",
  RELEASED = "RELEASED",
  VERIFIED = "VERIFIED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
}

export interface IOrderStatusItem {
  status: OrderStatus
  date: Date
  by: IUser
}

export interface IPaymentStatusItem {
  status: PaymentStatus
  date: Date
  by: IUser
}

export interface IOrder extends Document {
  _id: ObjectId
  orderNumber: string
  customerName: string
  orderSlipURL: string
  amountToBePaid: number
  orderStatuses: IOrderStatusItem[]
  paymentStatuses: IPaymentStatusItem[]
}

export interface IOrderStatusInput {
  status: OrderStatus
  date: Date
  by: ObjectId
}

export interface IOrderInput extends Request {
  _id: ObjectId
  orderNumber: string
  customerName: string
  orderSlipURL: string
  amountToBePaid: number
  dateReceived?: Date
  orderStatuses: IOrderStatusItem[]
}

export interface IOrderNode {
  _id: ObjectId
  orderNumber: string
  customerName: string
  amountToBePaid: number
  dateReceived: Date
  currentStatus: OrderStatus
}

export interface IOrderEdge {
  node: IOrderNode
  cursor: string
}

export interface IOrderConnection {
  edges: IOrderEdge[]
  pageInfo: IPageInfo
}

import { Document, Types } from "mongoose"
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

export enum POSStatus {
  UNADDED = "UNADDED",
  ADDED = "ADDED",
  VERIFIED = "VERIFIED",
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
  amountPaid?: number
}

export interface IOrder extends Document {
  _id: Types.ObjectId
  orderNumber: string
  customerName: string
  orderSlipURL: string
  amountToBePaid: number
  orderStatuses: IOrderStatusItem[]
  paymentStatuses: IPaymentStatusItem[]
  addedToPOS: POSStatus
}

export interface IOrderStatusInput {
  status: OrderStatus
  date: Date
  by: Types.ObjectId
}

export interface IOrderInput extends Request {
  _id: Types.ObjectId
  orderNumber: string
  customerName: string
  orderSlipURL: string
  amountToBePaid: number
  dateReceived?: Date
  orderStatuses: IOrderStatusItem[]
}

export interface IOrderNode {
  _id: Types.ObjectId
  orderNumber: string
  customerName: string
  amountToBePaid: number
  dateReceived: Date
  currentStatus: OrderStatus
  addedToPOS: POSStatus
}

export interface IOrderEdge {
  node: IOrderNode
  cursor: string
}

export interface IOrderConnection {
  edges: IOrderEdge[]
  pageInfo: IPageInfo
}
